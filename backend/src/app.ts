/**
 * SmartStock 后端应用入口文件
 * Express 应用配置
 */

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';
import { createContainer, closeContainer } from './shared/container';
import { ResponseUtil } from './shared/utils/response';
import { createAuthRoutes, createUserRoutes } from './modules/users';
import { createCategoryRoutes } from './modules/categories';
import { createSupplierRoutes } from './modules/suppliers';
import { createLogRoutes } from './modules/logs';
import { createDashboardRoutes } from './modules/dashboard';
import { createProductRoutes } from './core/product';
import { createInventoryRoutes } from './core/inventory';

// 加载环境变量
dotenv.config({ path: '.env.development' });

/**
 * 创建 Express 应用实例
 */
const createApp = (): Application => {
  const app = express();

  // ============================================
  // 中间件配置
  // ============================================

  // CORS 跨域配置
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  // JSON 请求体解析
  app.use(express.json({ limit: '10mb' }));

  // URL 编码请求体解析
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // 健康检查路由
  // ============================================

  app.get('/health', (_req: Request, res: Response) => {
    ResponseUtil.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    }, '服务运行正常');
  });

  // ============================================
  // API 路由注册
  // ============================================

  // API 基础路径
  const API_BASE = '/api/v1';

  // 临时测试路由（后续会替换为实际的模块路由）
  app.get(`${API_BASE}`, (_req: Request, res: Response) => {
    ResponseUtil.success(res, {
      name: 'SmartStock API',
      version: '1.0.0',
      description: '智能库存管理助手 API',
    }, 'API 服务正常');
  });

  // 注册各模块路由
  app.use(`${API_BASE}/auth`, createAuthRoutes());
  app.use(`${API_BASE}/users`, createUserRoutes());
  app.use(`${API_BASE}/categories`, createCategoryRoutes());
  app.use(`${API_BASE}/suppliers`, createSupplierRoutes());
  app.use(`${API_BASE}/products`, createProductRoutes());
  app.use(`${API_BASE}/inventory`, createInventoryRoutes());
  app.use(`${API_BASE}/logs`, createLogRoutes());
  app.use(`${API_BASE}/dashboard`, createDashboardRoutes());

  // ============================================
  // 错误处理
  // ============================================

  // 404 路由未找到处理
  app.use(notFoundHandler);

  // 全局错误处理
  app.use(errorHandler);

  return app;
};

/**
 * 启动服务器
 */
const startServer = async (): Promise<void> => {
  try {
    // 初始化依赖注入容器
    const container = createContainer();
    
    // 测试数据库连接
    await container.prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 创建应用实例
    const app = createApp();

    // 获取端口配置
    const PORT = parseInt(process.env.PORT || '3001', 10);

    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`🚀 服务器启动成功`);
      console.log(`   - 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - 端口: ${PORT}`);
      console.log(`   - API: http://localhost:${PORT}/api/v1`);
      console.log(`   - 健康检查: http://localhost:${PORT}/health`);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n📴 收到 ${signal} 信号，正在关闭服务器...`);
      
      server.close(async () => {
        console.log('🔌 HTTP 服务器已关闭');
        
        // 关闭数据库连接
        await closeContainer();
        console.log('🔌 数据库连接已关闭');
        
        console.log('👋 服务器已完全关闭');
        process.exit(0);
      });

      // 强制关闭超时
      setTimeout(() => {
        console.error('⚠️ 强制关闭服务器');
        process.exit(1);
      }, 10000);
    };

    // 监听进程信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // 未捕获的异常处理
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ 未捕获的异常:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('❌ 未处理的 Promise 拒绝:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 导出应用创建函数（用于测试）
export { createApp };

// 启动服务器
startServer();
