/**
 * 用户路由配置
 * 定义用户相关的 API 路由
 */

import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getPrismaClient } from '../../shared/container';

/**
 * 创建认证路由
 * @returns Express Router
 */
export const createAuthRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const userService = new UserService(prisma);
  const userController = new UserController(userService);

  // 公开路由（无需认证）
  router.post('/login', userController.login);
  router.post('/reset-password', userController.resetPassword);

  // 需要认证的路由
  router.post('/logout', authMiddleware, userController.logout);
  router.get('/me', authMiddleware, userController.getCurrentUser);

  return router;
};

/**
 * 创建用户管理路由
 * @returns Express Router
 */
export const createUserRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const userService = new UserService(prisma);
  const userController = new UserController(userService);

  // 所有用户管理路由都需要认证
  router.use(authMiddleware);

  // 用户 CRUD 路由
  router.get('/', userController.findAll);
  router.get('/:id', userController.findById);
  router.post('/', userController.create);
  router.put('/:id', userController.update);
  router.delete('/:id', userController.delete);

  return router;
};

export default {
  createAuthRoutes,
  createUserRoutes,
};
