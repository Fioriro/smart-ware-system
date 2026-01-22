/**
 * 库存管理路由配置
 */

import { Router } from 'express';
import { InventoryController } from './InventoryController';
import { InventoryService } from '../application/InventoryService';
import { TransactionRepository } from '../infrastructure/TransactionRepository';
import { ProductRepository } from '../../product/infrastructure/ProductRepository';
import { getPrismaClient } from '../../../shared/container';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { noCache, invalidateInventoryCache } from '../../../shared/middleware/cache.middleware';

/**
 * 创建库存管理路由
 * @returns Express Router
 */
export const createInventoryRoutes = (): Router => {
  const router = Router();

  // 所有库存管理路由都需要认证
  router.use(authMiddleware);

  // 获取 Prisma 客户端
  const prisma = getPrismaClient();

  // 创建仓储实例
  const productRepository = new ProductRepository(prisma);
  const transactionRepository = new TransactionRepository(prisma);

  // 创建服务实例
  const inventoryService = new InventoryService(
    prisma,
    productRepository,
    transactionRepository
  );

  // 创建控制器实例
  const inventoryController = new InventoryController(inventoryService);

  // ============================================
  // 入库相关路由
  // ============================================

  /**
   * POST /api/v1/inventory/inbound
   * 单个商品入库
   * 入库操作会失效商品和仪表盘缓存
   */
  router.post('/inbound', noCache, invalidateInventoryCache, inventoryController.inbound);

  /**
   * POST /api/v1/inventory/inbound/batch
   * 批量入库
   * 批量入库操作会失效商品和仪表盘缓存
   */
  router.post('/inbound/batch', noCache, invalidateInventoryCache, inventoryController.batchInbound);

  /**
   * GET /api/v1/inventory/inbound/records
   * 获取入库记录列表
   * Query params:
   *   - page: 页码
   *   - pageSize: 每页数量
   *   - sku: SKU 搜索
   *   - supplierId: 供应商 ID 筛选
   *   - startDate: 开始时间
   *   - endDate: 结束时间
   */
  router.get('/inbound/records', inventoryController.getInboundRecords);

  // ============================================
  // 出库相关路由
  // ============================================

  /**
   * POST /api/v1/inventory/outbound
   * 商品出库
   * 出库操作会失效商品和仪表盘缓存
   */
  router.post('/outbound', noCache, invalidateInventoryCache, inventoryController.outbound);

  /**
   * GET /api/v1/inventory/outbound/records
   * 获取出库记录列表
   * Query params:
   *   - page: 页码
   *   - pageSize: 每页数量
   *   - sku: SKU 搜索
   *   - startDate: 开始时间
   *   - endDate: 结束时间
   */
  router.get('/outbound/records', inventoryController.getOutboundRecords);

  return router;
};

export default createInventoryRoutes;
