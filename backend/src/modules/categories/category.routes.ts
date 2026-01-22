/**
 * 商品分类路由配置
 * 定义分类相关的 API 路由
 */

import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import {
  mediumCache,
  noCache,
  categoryTreeCache,
  invalidateCategoryCache,
} from '../../shared/middleware/cache.middleware';
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
  // GET 请求使用服务端缓存 + HTTP 缓存（5分钟），分类数据相对稳定
  router.get('/', mediumCache, categoryTreeCache, categoryController.getCategoryTree);
  router.get('/:id', mediumCache, categoryController.findById);
  // 写操作禁止缓存，并在成功后失效相关缓存
  router.post('/', noCache, invalidateCategoryCache, categoryController.create);
  router.put('/:id', noCache, invalidateCategoryCache, categoryController.update);
  router.delete('/:id', noCache, invalidateCategoryCache, categoryController.delete);

  return router;
};

export default {
  createCategoryRoutes,
};
