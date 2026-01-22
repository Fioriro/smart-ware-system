/**
 * API 响应缓存中间件
 * 提供服务端内存缓存和 HTTP 缓存控制
 */

import { Request, Response, NextFunction } from 'express';

// ============================================
// 内存缓存实现
// ============================================

/**
 * 缓存条目接口
 */
interface CacheEntry {
  /** 缓存的数据 */
  data: unknown;
  /** 过期时间戳 */
  expiresAt: number;
  /** 创建时间戳 */
  createdAt: number;
}

/**
 * 缓存统计信息
 */
interface CacheStats {
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 当前缓存条目数 */
  size: number;
  /** 命中率 */
  hitRate: number;
}

/**
 * 内存缓存类
 * 使用 Map 实现简单的 TTL 缓存
 */
class MemoryCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // 每分钟清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存数据或 null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 缓存数据
   * @param ttlSeconds TTL（秒）
   */
  set(key: string, data: unknown, ttlSeconds: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      createdAt: now,
    });
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 根据前缀删除缓存
   * @param prefix 缓存键前缀
   * @returns 删除的条目数
   */
  deleteByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 根据标签删除缓存
   * @param tag 缓存标签
   * @returns 删除的条目数
   */
  deleteByTag(tag: string): number {
    return this.deleteByPrefix(`${tag}:`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * 销毁缓存实例
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// 全局缓存实例
const globalCache = new MemoryCache();

/**
 * 获取全局缓存实例
 */
export function getCache(): MemoryCache {
  return globalCache;
}

// ============================================
// 缓存中间件
// ============================================

/**
 * 缓存配置选项
 */
interface CacheOptions {
  /** 缓存时间（秒） */
  maxAge: number;
  /** 是否为私有缓存（仅客户端缓存） */
  private?: boolean;
  /** 是否必须重新验证 */
  mustRevalidate?: boolean;
  /** 是否禁止缓存 */
  noCache?: boolean;
  /** 是否禁止存储 */
  noStore?: boolean;
}

/**
 * 服务端缓存配置选项
 */
interface ServerCacheOptions {
  /** 缓存 TTL（秒） */
  ttl: number;
  /** 缓存标签（用于批量失效） */
  tag?: string;
  /** 自定义缓存键生成函数 */
  keyGenerator?: (req: Request) => string;
}

/**
 * 生成默认缓存键
 * @param req Express 请求对象
 * @returns 缓存键
 */
function generateCacheKey(req: Request): string {
  // 使用请求路径和查询参数生成缓存键
  const queryString = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&');
  
  return queryString ? `${req.path}?${queryString}` : req.path;
}

/**
 * 创建服务端缓存中间件
 * 缓存 API 响应到内存中
 * @param options 缓存配置
 */
export function serverCache(options: ServerCacheOptions) {
  const { ttl, tag, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // 只缓存 GET 请求
    if (req.method !== 'GET') {
      return next();
    }

    // 生成缓存键
    const baseKey = keyGenerator ? keyGenerator(req) : generateCacheKey(req);
    const cacheKey = tag ? `${tag}:${baseKey}` : baseKey;

    // 尝试从缓存获取
    const cachedData = globalCache.get<{ body: unknown; statusCode: number }>(cacheKey);
    
    if (cachedData) {
      // 缓存命中，直接返回
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.status(cachedData.statusCode).json(cachedData.body);
    }

    // 缓存未命中，拦截响应
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);

    // 保存原始的 json 方法
    const originalJson = res.json.bind(res);

    // 重写 json 方法以捕获响应
    res.json = function(body: unknown) {
      // 只缓存成功的响应（2xx 状态码）
      if (res.statusCode >= 200 && res.statusCode < 300) {
        globalCache.set(cacheKey, { body, statusCode: res.statusCode }, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * 创建缓存失效中间件
 * 在数据变更时清除相关缓存
 * @param tags 要失效的缓存标签数组
 */
export function invalidateCache(...tags: string[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    // 在响应完成后失效缓存
    res.on('finish', () => {
      // 只在成功的写操作后失效缓存
      if (res.statusCode >= 200 && res.statusCode < 300) {
        tags.forEach(tag => {
          const count = globalCache.deleteByTag(tag);
          if (count > 0) {
            console.log(`[Cache] Invalidated ${count} entries for tag: ${tag}`);
          }
        });
      }
    });
    next();
  };
}

// ============================================
// HTTP 缓存控制中间件
// ============================================

/**
 * 创建缓存控制中间件
 * @param options 缓存配置选项
 */
export function cacheControl(options: CacheOptions) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const directives: string[] = [];

    if (options.noStore) {
      directives.push('no-store');
    } else if (options.noCache) {
      directives.push('no-cache');
    } else {
      if (options.private) {
        directives.push('private');
      } else {
        directives.push('public');
      }

      directives.push(`max-age=${options.maxAge}`);

      if (options.mustRevalidate) {
        directives.push('must-revalidate');
      }
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

/**
 * 禁止缓存中间件
 * 用于敏感数据或频繁变化的数据
 */
export function noCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}

/**
 * 短期缓存中间件（1分钟）
 * 适用于仪表盘统计数据等
 */
export function shortCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'private, max-age=60');
  next();
}

/**
 * 中期缓存中间件（5分钟）
 * 适用于分类列表等相对稳定的数据
 */
export function mediumCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'private, max-age=300');
  next();
}

/**
 * 长期缓存中间件（1小时）
 * 适用于很少变化的静态数据
 */
export function longCache(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
}

/**
 * 条件缓存中间件
 * 根据请求方法决定是否缓存
 * GET 请求使用缓存，其他请求禁止缓存
 */
export function conditionalCache(maxAge: number = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `private, max-age=${maxAge}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

/**
 * ETag 支持中间件
 * 为响应添加 ETag 头，支持条件请求
 */
export function etagSupport(_req: Request, res: Response, next: NextFunction) {
  // Express 默认启用 ETag，这里确保启用
  res.set('ETag', 'true');
  next();
}

// ============================================
// 预定义缓存配置
// ============================================

/**
 * 缓存标签常量
 */
export const CacheTags = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  DASHBOARD: 'dashboard',
  SUPPLIERS: 'suppliers',
  USERS: 'users',
} as const;

/**
 * 缓存 TTL 常量（秒）
 */
export const CacheTTL = {
  /** 短期缓存：30秒 */
  SHORT: 30,
  /** 中期缓存：2分钟 */
  MEDIUM: 120,
  /** 长期缓存：5分钟 */
  LONG: 300,
  /** 仪表盘缓存：30秒 */
  DASHBOARD: 30,
  /** 分类缓存：5分钟 */
  CATEGORIES: 300,
  /** 商品列表缓存：1分钟 */
  PRODUCTS: 60,
} as const;

/**
 * 商品列表缓存中间件
 * TTL: 1分钟
 */
export const productListCache = serverCache({
  ttl: CacheTTL.PRODUCTS,
  tag: CacheTags.PRODUCTS,
});

/**
 * 分类树缓存中间件
 * TTL: 5分钟
 */
export const categoryTreeCache = serverCache({
  ttl: CacheTTL.CATEGORIES,
  tag: CacheTags.CATEGORIES,
});

/**
 * 仪表盘统计缓存中间件
 * TTL: 30秒
 */
export const dashboardStatsCache = serverCache({
  ttl: CacheTTL.DASHBOARD,
  tag: CacheTags.DASHBOARD,
});

/**
 * 商品缓存失效中间件
 * 在商品数据变更时清除商品和仪表盘缓存
 */
export const invalidateProductCache = invalidateCache(
  CacheTags.PRODUCTS,
  CacheTags.DASHBOARD
);

/**
 * 分类缓存失效中间件
 * 在分类数据变更时清除分类缓存
 */
export const invalidateCategoryCache = invalidateCache(CacheTags.CATEGORIES);

/**
 * 库存缓存失效中间件
 * 在库存变更时清除商品和仪表盘缓存
 */
export const invalidateInventoryCache = invalidateCache(
  CacheTags.PRODUCTS,
  CacheTags.DASHBOARD
);

export default {
  // 内存缓存
  getCache,
  serverCache,
  invalidateCache,
  // HTTP 缓存控制
  cacheControl,
  noCache,
  shortCache,
  mediumCache,
  longCache,
  conditionalCache,
  etagSupport,
  // 预定义缓存
  CacheTags,
  CacheTTL,
  productListCache,
  categoryTreeCache,
  dashboardStatsCache,
  invalidateProductCache,
  invalidateCategoryCache,
  invalidateInventoryCache,
};
