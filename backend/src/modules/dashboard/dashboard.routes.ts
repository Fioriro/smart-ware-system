/**
 * 仪表盘路由配置
 * 定义仪表盘相关的 API 路由
 */

import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { shortCache, dashboardStatsCache } from '../../shared/middleware/cache.middleware';
import { getPrismaClient } from '../../shared/container';

/**
 * 创建仪表盘路由
 * @returns Express Router
 */
export const createDashboardRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const dashboardService = new DashboardService(prisma);
  const dashboardController = new DashboardController(dashboardService);

  // 所有仪表盘路由都需要认证
  router.use(authMiddleware);

  // 仪表盘路由 - 使用服务端缓存（30秒）+ HTTP 缓存（1分钟）
  router.get('/stats', shortCache, dashboardStatsCache, dashboardController.getStats);

  return router;
};

export default {
  createDashboardRoutes,
};
