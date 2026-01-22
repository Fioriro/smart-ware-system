/**
 * 商品分类路由配置
 * 定义分类相关的 API 路由
 */

import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getPrismaClient } from '../../shared/container';

/**
 * 创建分类路由
 * @returns Express Router
 */
export const createCategoryRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const categoryService = new CategoryService(prisma);
  const categoryController = new CategoryController(categoryService);

  // 所有分类路由都需要认证
  router.use(authMiddleware);

  // 分类 CRUD 路由
  router.get('/', categoryController.getCategoryTree);
  router.get('/:id', categoryController.findById);
  router.post('/', categoryController.create);
  router.put('/:id', categoryController.update);
  router.delete('/:id', categoryController.delete);

  return router;
};

export default {
  createCategoryRoutes,
};
