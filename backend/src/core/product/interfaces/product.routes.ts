/**
 * 商品路由配置
 * 定义商品相关的 API 路由
 */

import { Router } from 'express';
import { ProductController } from './ProductController';
import { ProductService } from '../application/ProductService';
import { ProductRepository } from '../infrastructure/ProductRepository';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import {
  shortCache,
  noCache,
  productListCache,
  invalidateProductCache,
} from '../../../shared/middleware/cache.middleware';
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
  // 低库存查询使用服务端缓存 + HTTP 缓存
  router.get('/low-stock', shortCache, productListCache, productController.findLowStock);
  router.get('/sku/:sku', shortCache, productController.findBySku);

  // 商品 CRUD 路由
  // GET 请求使用服务端缓存 + HTTP 缓存
  router.get('/', shortCache, productListCache, productController.findAll);
  router.get('/:id', shortCache, productController.findById);
  // 写操作禁止缓存，并在成功后失效相关缓存
  router.post('/', noCache, invalidateProductCache, productController.create);
  router.put('/:id', noCache, invalidateProductCache, productController.update);
  router.delete('/:id', noCache, invalidateProductCache, productController.delete);

  return router;
};

export default {
  createProductRoutes,
};
