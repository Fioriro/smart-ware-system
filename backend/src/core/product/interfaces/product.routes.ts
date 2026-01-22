/**
 * 商品路由配置
 * 定义商品相关的 API 路由
 */

import { Router } from 'express';
import { ProductController } from './ProductController';
import { ProductService } from '../application/ProductService';
import { ProductRepository } from '../infrastructure/ProductRepository';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { getPrismaClient } from '../../../shared/container';

/**
 * 创建商品路由
 * @returns Express Router
 */
export const createProductRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const productRepository = new ProductRepository(prisma);
  const productService = new ProductService(productRepository);
  const productController = new ProductController(productService);

  // 所有商品路由都需要认证
  router.use(authMiddleware);

  // 特殊路由（需要放在参数路由之前）
  router.get('/low-stock', productController.findLowStock);
  router.get('/sku/:sku', productController.findBySku);

  // 商品 CRUD 路由
  router.get('/', productController.findAll);
  router.get('/:id', productController.findById);
  router.post('/', productController.create);
  router.put('/:id', productController.update);
  router.delete('/:id', productController.delete);

  return router;
};

export default {
  createProductRoutes,
};
