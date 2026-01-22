/**
 * 供应商路由配置
 * 定义供应商相关的 API 路由
 */

import { Router } from 'express';
import { SupplierController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { getPrismaClient } from '../../shared/container';

/**
 * 创建供应商路由
 * @returns Express Router
 */
export const createSupplierRoutes = (): Router => {
  const router = Router();
  const prisma = getPrismaClient();
  const supplierService = new SupplierService(prisma);
  const supplierController = new SupplierController(supplierService);

  // 所有供应商路由都需要认证
  router.use(authMiddleware);

  // 供应商 CRUD 路由
  router.get('/', supplierController.findAll);
  router.get('/:id', supplierController.findById);
  router.post('/', supplierController.create);
  router.put('/:id', supplierController.update);
  router.delete('/:id', supplierController.delete);

  return router;
};

export default {
  createSupplierRoutes,
};
