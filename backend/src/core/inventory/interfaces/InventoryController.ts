/**
 * InventoryController
 * 库存管理 HTTP 请求处理
 */

import { Request, Response } from 'express';
import {
  InventoryService,
  InboundCommand,
  OutboundCommand,
  BatchInboundCommand,
} from '../application/InventoryService';
import { TransactionQueryParams } from '../domain/repositories/ITransactionRepository';
import { ResponseUtil } from '../../../shared/utils/response';

/**
 * 库存控制器类
 */
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  /**
   * 单个商品入库
   * POST /api/v1/inventory/inbound
   */
  inbound = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sku, quantity, supplierId, remark } = req.body;

      // 验证必填字段
      if (!sku || sku.trim() === '') {
        ResponseUtil.error(res, 'SKU 不能为空');
        return;
      }

      if (quantity === undefined || quantity === null) {
        ResponseUtil.error(res, '入库数量不能为空');
        return;
      }

      if (quantity <= 0) {
        ResponseUtil.error(res, '入库数量必须为正整数');
        return;
      }

      if (!Number.isInteger(quantity)) {
        ResponseUtil.error(res, '入库数量必须为整数');
        return;
      }

      // 获取操作人 ID（从 JWT 中获取，暂时使用默认值）
      const operatorId = (req as Request & { user?: { userId: number } }).user?.userId || 1;

      const command: InboundCommand = {
        sku: sku.trim(),
        quantity,
        supplierId: supplierId || null,
        operatorId,
        remark: remark || undefined,
      };

      const result = await this.inventoryService.inbound(command);
      ResponseUtil.created(res, result, '入库成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '入库失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else if (message === '并发冲突，请重试') {
        ResponseUtil.error(res, message, 409);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 批量入库
   * POST /api/v1/inventory/inbound/batch
   */
  batchInbound = async (req: Request, res: Response): Promise<void> => {
    try {
      const { items } = req.body;

      // 验证入库列表
      if (!items || !Array.isArray(items) || items.length === 0) {
        ResponseUtil.error(res, '入库列表不能为空');
        return;
      }

      // 验证每一项
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.sku || item.sku.trim() === '') {
          ResponseUtil.error(res, `第 ${i + 1} 行：SKU 不能为空`);
          return;
        }
        if (item.quantity === undefined || item.quantity === null) {
          ResponseUtil.error(res, `第 ${i + 1} 行：入库数量不能为空`);
          return;
        }
        if (item.quantity <= 0) {
          ResponseUtil.error(res, `第 ${i + 1} 行：入库数量必须为正整数`);
          return;
        }
        if (!Number.isInteger(item.quantity)) {
          ResponseUtil.error(res, `第 ${i + 1} 行：入库数量必须为整数`);
          return;
        }
      }

      // 获取操作人 ID
      const operatorId = (req as Request & { user?: { userId: number } }).user?.userId || 1;

      const command: BatchInboundCommand = {
        items: items.map((item: { sku: string; quantity: number; supplierId?: number; remark?: string }) => ({
          sku: item.sku.trim(),
          quantity: item.quantity,
          supplierId: item.supplierId || null,
          operatorId,
          remark: item.remark || undefined,
        })),
        operatorId,
      };

      const result = await this.inventoryService.batchInbound(command);
      ResponseUtil.created(res, result, '批量入库成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '批量入库失败';
      if (message.includes('不存在')) {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('并发冲突')) {
        ResponseUtil.error(res, message, 409);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 获取入库记录列表
   * GET /api/v1/inventory/inbound/records
   */
  getInboundRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: TransactionQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        sku: req.query.sku as string | undefined,
        supplierId: req.query.supplierId ? parseInt(req.query.supplierId as string, 10) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      // 验证日期格式
      if (params.startDate && isNaN(params.startDate.getTime())) {
        ResponseUtil.error(res, '开始时间格式无效');
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        ResponseUtil.error(res, '结束时间格式无效');
        return;
      }

      const result = await this.inventoryService.getInboundRecords(params);
      ResponseUtil.paginated(
        res,
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取成功'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取入库记录失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 商品出库
   * POST /api/v1/inventory/outbound
   */
  outbound = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sku, quantity, remark } = req.body;

      // 验证必填字段
      if (!sku || sku.trim() === '') {
        ResponseUtil.error(res, 'SKU 不能为空');
        return;
      }

      if (quantity === undefined || quantity === null) {
        ResponseUtil.error(res, '出库数量不能为空');
        return;
      }

      if (quantity <= 0) {
        ResponseUtil.error(res, '出库数量必须为正整数');
        return;
      }

      if (!Number.isInteger(quantity)) {
        ResponseUtil.error(res, '出库数量必须为整数');
        return;
      }

      // 获取操作人 ID
      const operatorId = (req as Request & { user?: { userId: number } }).user?.userId || 1;

      const command: OutboundCommand = {
        sku: sku.trim(),
        quantity,
        operatorId,
        remark: remark || undefined,
      };

      const result = await this.inventoryService.outbound(command);
      ResponseUtil.created(res, result, '出库成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '出库失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else if (message.includes('库存不足')) {
        ResponseUtil.error(res, message);
      } else if (message === '并发冲突，请重试') {
        ResponseUtil.error(res, message, 409);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 获取出库记录列表
   * GET /api/v1/inventory/outbound/records
   */
  getOutboundRecords = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: TransactionQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        sku: req.query.sku as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      // 验证日期格式
      if (params.startDate && isNaN(params.startDate.getTime())) {
        ResponseUtil.error(res, '开始时间格式无效');
        return;
      }
      if (params.endDate && isNaN(params.endDate.getTime())) {
        ResponseUtil.error(res, '结束时间格式无效');
        return;
      }

      const result = await this.inventoryService.getOutboundRecords(params);
      ResponseUtil.paginated(
        res,
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取成功'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取出库记录失败';
      ResponseUtil.error(res, message);
    }
  };
}

export default InventoryController;
