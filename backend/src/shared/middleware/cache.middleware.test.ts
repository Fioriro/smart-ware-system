/**
 * 缓存中间件单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  getCache,
  serverCache,
  invalidateCache,
  noCache,
  shortCache,
  mediumCache,
  CacheTags,
  CacheTTL,
} from './cache.middleware';

// Mock Express Request/Response
function createMockRequest(options: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    path: '/api/v1/products',
    query: {},
    ...options,
  } as Request;
}

function createMockResponse(): Response & { 
  headers: Record<string, string>;
  statusCode: number;
  jsonData: unknown;
  finishCallbacks: (() => void)[];
} {
  const res = {
    headers: {} as Record<string, string>,
    statusCode: 200,
    jsonData: null as unknown,
    finishCallbacks: [] as (() => void)[],
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.jsonData = data;
      return this;
    },
    on(event: string, callback: () => void) {
      if (event === 'finish') {
        this.finishCallbacks.push(callback);
      }
      return this;
    },
    emit(event: string) {
      if (event === 'finish') {
        this.finishCallbacks.forEach(cb => cb());
      }
    },
  };
  return res as unknown as Response & typeof res;
}

describe('MemoryCache', () => {
  beforeEach(() => {
    // 清空缓存
    getCache().clear();
  });

  describe('get/set', () => {
    it('should store and retrieve data', () => {
      const cache = getCache();
      cache.set('test-key', { data: 'test' }, 60);
      
      const result = cache.get<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent key', () => {
      const cache = getCache();
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return null for expired entry', async () => {
      const cache = getCache();
      cache.set('expired-key', { data: 'test' }, 0.001); // 1ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = cache.get('expired-key');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a specific key', () => {
      const cache = getCache();
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);
      
      cache.delete('key1');
      
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
  });

  describe('deleteByPrefix', () => {
    it('should delete all keys with matching prefix', () => {
      const cache = getCache();
      cache.set('products:list', 'data1', 60);
      cache.set('products:detail', 'data2', 60);
      cache.set('categories:tree', 'data3', 60);
      
      const count = cache.deleteByPrefix('products:');
      
      expect(count).toBe(2);
      expect(cache.get('products:list')).toBeNull();
      expect(cache.get('products:detail')).toBeNull();
      expect(cache.get('categories:tree')).toBe('data3');
    });
  });

  describe('deleteByTag', () => {
    it('should delete all entries with matching tag', () => {
      const cache = getCache();
      cache.set('products:/api/v1/products', 'data1', 60);
      cache.set('products:/api/v1/products/low-stock', 'data2', 60);
      cache.set('categories:/api/v1/categories', 'data3', 60);
      
      const count = cache.deleteByTag('products');
      
      expect(count).toBe(2);
      expect(cache.get('products:/api/v1/products')).toBeNull();
      expect(cache.get('categories:/api/v1/categories')).toBe('data3');
    });
  });

  describe('getStats', () => {
    it('should track hits and misses', () => {
      const cache = getCache();
      cache.set('key1', 'value1', 60);
      
      // 1 hit
      cache.get('key1');
      // 2 misses
      cache.get('non-existent1');
      cache.get('non-existent2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(1/3, 2);
    });
  });
});

describe('serverCache middleware', () => {
  beforeEach(() => {
    getCache().clear();
  });

  it('should cache GET request responses', () => {
    const middleware = serverCache({ ttl: 60, tag: 'test' });
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    // First request - cache miss
    middleware(req, res, next);
    expect(res.headers['X-Cache']).toBe('MISS');
    expect(next).toHaveBeenCalled();

    // Simulate response
    res.json({ data: 'test' });

    // Second request - cache hit
    const req2 = createMockRequest();
    const res2 = createMockResponse();
    const next2 = vi.fn();

    middleware(req2, res2, next2);
    expect(res2.headers['X-Cache']).toBe('HIT');
    expect(res2.jsonData).toEqual({ data: 'test' });
    expect(next2).not.toHaveBeenCalled();
  });

  it('should not cache non-GET requests', () => {
    const middleware = serverCache({ ttl: 60, tag: 'test' });
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.headers['X-Cache']).toBeUndefined();
  });

  it('should include query params in cache key', () => {
    const middleware = serverCache({ ttl: 60, tag: 'test' });
    
    // Request with query params
    const req1 = createMockRequest({ query: { page: '1', pageSize: '10' } });
    const res1 = createMockResponse();
    const next1 = vi.fn();

    middleware(req1, res1, next1);
    res1.json({ page: 1 });

    // Different query params - should be cache miss
    const req2 = createMockRequest({ query: { page: '2', pageSize: '10' } });
    const res2 = createMockResponse();
    const next2 = vi.fn();

    middleware(req2, res2, next2);
    expect(res2.headers['X-Cache']).toBe('MISS');
  });
});

describe('invalidateCache middleware', () => {
  beforeEach(() => {
    getCache().clear();
  });

  it('should invalidate cache on successful response', () => {
    const cache = getCache();
    cache.set('products:/api/v1/products', 'cached-data', 60);
    cache.set('dashboard:/api/v1/dashboard/stats', 'cached-stats', 60);

    const middleware = invalidateCache('products', 'dashboard');
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    res.statusCode = 201;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Simulate response finish
    res.emit('finish');

    // Cache should be invalidated
    expect(cache.get('products:/api/v1/products')).toBeNull();
    expect(cache.get('dashboard:/api/v1/dashboard/stats')).toBeNull();
  });

  it('should not invalidate cache on error response', () => {
    const cache = getCache();
    cache.set('products:/api/v1/products', 'cached-data', 60);

    const middleware = invalidateCache('products');
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    res.statusCode = 400; // Error response
    const next = vi.fn();

    middleware(req, res, next);
    res.emit('finish');

    // Cache should NOT be invalidated
    expect(cache.get('products:/api/v1/products')).toBe('cached-data');
  });
});

describe('HTTP Cache Control middlewares', () => {
  it('noCache should set no-store headers', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    noCache(req, res, next);

    expect(res.headers['Cache-Control']).toContain('no-store');
    expect(res.headers['Cache-Control']).toContain('no-cache');
    expect(res.headers['Pragma']).toBe('no-cache');
    expect(next).toHaveBeenCalled();
  });

  it('shortCache should set 1 minute cache', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    shortCache(req, res, next);

    expect(res.headers['Cache-Control']).toBe('private, max-age=60');
    expect(next).toHaveBeenCalled();
  });

  it('mediumCache should set 5 minute cache', () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    mediumCache(req, res, next);

    expect(res.headers['Cache-Control']).toBe('private, max-age=300');
    expect(next).toHaveBeenCalled();
  });
});

describe('Cache constants', () => {
  it('should have correct cache tags', () => {
    expect(CacheTags.PRODUCTS).toBe('products');
    expect(CacheTags.CATEGORIES).toBe('categories');
    expect(CacheTags.DASHBOARD).toBe('dashboard');
  });

  it('should have correct TTL values', () => {
    expect(CacheTTL.SHORT).toBe(30);
    expect(CacheTTL.MEDIUM).toBe(120);
    expect(CacheTTL.LONG).toBe(300);
    expect(CacheTTL.DASHBOARD).toBe(30);
    expect(CacheTTL.CATEGORIES).toBe(300);
    expect(CacheTTL.PRODUCTS).toBe(60);
  });
});
