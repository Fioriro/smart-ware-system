/**
 * InventoryService 应用服务
 * 库存管理业务逻辑编排（含事务控制）
 */

import { PrismaClient } from '@prisma/client';
import { InventoryTransaction, TransactionType } from '../domain/entities/InventoryTransaction';
import { ITransactionRepository, TransactionQueryParams, TransactionListItem } from '../domain/repositories/ITransactionRepository';
import { IProductRepository } from '../../product/domain/repositories/IProductRepository';
import { PaginationResult } from '../../../shared/utils/pagination';

/**
 * 入库命令 DTO
 */
export interface InboundCommand {
  sku: string;
  quantity: number;
  supplierId: number | null;
  operatorId: number;
  remark?: string;
}

/**
 * 批量入库命令 DTO
 */
export interface BatchInboundCommand {
  items: InboundCommand[];
  operatorId: number;
}

/**
 * 出库命令 DTO
 */
export interface OutboundCommand {
  sku: string;
  quantity: number;
  operatorId: number;
  remark?: string;
}

/**
 * 交易记录响应 DTO
 */
export interface TransactionDTO {
  id: number;
  type: TransactionType;
  productId: number;
  sku: string;
  productName?: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  supplierId: number | null;
  supplierName?: string;
  operatorId: number;
  operatorName?: string;
  remark: string | null;
  createdAt: Date;
}

/**
 * 入库结果 DTO
 */
export interface InboundResultDTO {
  transactionId: number;
  sku: string;
  productName: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
}

/**
 * 批量入库结果 DTO
 */
export interface BatchInboundResultDTO {
  success: boolean;
  totalItems: number;
  results: InboundResultDTO[];
}

/**
 * 将交易实体转换为 DTO
 */
function toTransactionDTO(item: TransactionListItem): TransactionDTO {
  const transaction = item.transaction;
  return {
    id: transaction.getId(),
    type: transaction.getType(),
    productId: transaction.getProductId(),
    sku: transaction.getSku(),
    productName: item.productName,
    quantity: transaction.getQuantity(),
    quantityBefore: transaction.getQuantityBefore(),
    quantityAfter: transaction.getQuantityAfter(),
    supplierId: transaction.getSupplierId(),
    supplierName: item.supplierName,
    operatorId: transaction.getOperatorId(),
    operatorName: item.operatorName,
    remark: transaction.getRemark(),
    createdAt: transaction.getCreatedAt(),
  };
}

/**
 * 库存应用服务类
 */
export class InventoryService {
  constructor(
    private prisma: PrismaClient,
    private productRepository: IProductRepository,
    private transactionRepository: ITransactionRepository
  ) {}

  /**
   * 单个商品入库
   * @param command 入库命令
   * @returns 入库结果
   */
  async inbound(command: InboundCommand): Promise<InboundResultDTO> {
    // 验证入库数量
    if (command.quantity <= 0) {
      throw new Error('入库数量必须为正整数');
    }
    if (!Number.isInteger(command.quantity)) {
      throw new Error('入库数量必须为整数');
    }

    // 使用 Prisma 事务确保数据一致性
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 查找商品
      const product = await this.productRepository.findBySku(command.sku);
      if (!product) {
        throw new Error('商品不存在');
      }

      // 2. 执行入库操作
      const { before, after } = product.inbound(command.quantity);

      // 3. 创建交易记录
      const transaction = InventoryTransaction.createInbound({
        productId: product.getId(),
        sku: command.sku,
        quantity: command.quantity,
        quantityBefore: before,
        quantityAfter: after,
        supplierId: command.supplierId,
        operatorId: command.operatorId,
        remark: command.remark,
      });

      // 4. 使用乐观锁更新库存
      const updated = await tx.product.updateMany({
        where: {
          id: product.getId(),
          version: product.getVersion(),
        },
        data: {
          quantity: after,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error('并发冲突，请重试');
      }

      // 5. 保存交易记录
      const savedTransaction = await this.transactionRepository.save(transaction, tx);

      return {
        transactionId: savedTransaction.getId(),
        sku: command.sku,
        productName: product.getName(),
        quantity: command.quantity,
        quantityBefore: before,
        quantityAfter: after,
      };
    });

    return result;
  }

  /**
   * 批量入库
   * @param command 批量入库命令
   * @returns 批量入库结果
   */
  async batchInbound(command: BatchInboundCommand): Promise<BatchInboundResultDTO> {
    if (!command.items || command.items.length === 0) {
      throw new Error('入库列表不能为空');
    }

    // 验证所有入库项
    for (let i = 0; i < command.items.length; i++) {
      const item = command.items[i];
      if (!item.sku || item.sku.trim() === '') {
        throw new Error(`第 ${i + 1} 行：SKU 不能为空`);
      }
      if (item.quantity <= 0) {
        throw new Error(`第 ${i + 1} 行：入库数量必须为正整数`);
      }
      if (!Number.isInteger(item.quantity)) {
        throw new Error(`第 ${i + 1} 行：入库数量必须为整数`);
      }
    }

    // 使用 Prisma 事务确保数据一致性
    const results = await this.prisma.$transaction(async (tx) => {
      const inboundResults: InboundResultDTO[] = [];

      for (let i = 0; i < command.items.length; i++) {
        const item = command.items[i];

        // 1. 查找商品
        const product = await this.productRepository.findBySku(item.sku);
        if (!product) {
          throw new Error(`第 ${i + 1} 行：商品 ${item.sku} 不存在`);
        }

        // 2. 执行入库操作
        const { before, after } = product.inbound(item.quantity);

        // 3. 创建交易记录
        const transaction = InventoryTransaction.createInbound({
          productId: product.getId(),
          sku: item.sku,
          quantity: item.quantity,
          quantityBefore: before,
          quantityAfter: after,
          supplierId: item.supplierId,
          operatorId: command.operatorId,
          remark: item.remark,
        });

        // 4. 使用乐观锁更新库存
        const updated = await tx.product.updateMany({
          where: {
            id: product.getId(),
            version: product.getVersion(),
          },
          data: {
            quantity: after,
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });

        if (updated.count === 0) {
          throw new Error(`第 ${i + 1} 行：并发冲突，请重试`);
        }

        // 5. 保存交易记录
        const savedTransaction = await this.transactionRepository.save(transaction, tx);

        inboundResults.push({
          transactionId: savedTransaction.getId(),
          sku: item.sku,
          productName: product.getName(),
          quantity: item.quantity,
          quantityBefore: before,
          quantityAfter: after,
        });
      }

      return inboundResults;
    });

    return {
      success: true,
      totalItems: results.length,
      results,
    };
  }

  /**
   * 商品出库
   * @param command 出库命令
   * @returns 出库结果
   */
  async outbound(command: OutboundCommand): Promise<InboundResultDTO> {
    // 验证出库数量
    if (command.quantity <= 0) {
      throw new Error('出库数量必须为正整数');
    }
    if (!Number.isInteger(command.quantity)) {
      throw new Error('出库数量必须为整数');
    }

    // 使用 Prisma 事务确保数据一致性
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 查找商品
      const product = await this.productRepository.findBySku(command.sku);
      if (!product) {
        throw new Error('商品不存在');
      }

      // 2. 检查库存是否充足
      if (!product.canOutbound(command.quantity)) {
        throw new Error(`库存不足，当前库存: ${product.getQuantity()}，请求出库: ${command.quantity}`);
      }

      // 3. 执行出库操作
      const { before, after } = product.outbound(command.quantity);

      // 4. 创建交易记录
      const transaction = InventoryTransaction.createOutbound({
        productId: product.getId(),
        sku: command.sku,
        quantity: command.quantity,
        quantityBefore: before,
        quantityAfter: after,
        operatorId: command.operatorId,
        remark: command.remark,
      });

      // 5. 使用乐观锁更新库存
      const updated = await tx.product.updateMany({
        where: {
          id: product.getId(),
          version: product.getVersion(),
        },
        data: {
          quantity: after,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new Error('并发冲突，请重试');
      }

      // 6. 保存交易记录
      const savedTransaction = await this.transactionRepository.save(transaction, tx);

      return {
        transactionId: savedTransaction.getId(),
        sku: command.sku,
        productName: product.getName(),
        quantity: command.quantity,
        quantityBefore: before,
        quantityAfter: after,
      };
    });

    return result;
  }

  /**
   * 获取入库记录列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async getInboundRecords(params?: TransactionQueryParams): Promise<PaginationResult<TransactionDTO>> {
    const result = await this.transactionRepository.findByType('IN', params);

    return {
      list: result.list.map(toTransactionDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * 获取出库记录列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async getOutboundRecords(params?: TransactionQueryParams): Promise<PaginationResult<TransactionDTO>> {
    const result = await this.transactionRepository.findByType('OUT', params);

    return {
      list: result.list.map(toTransactionDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * 获取所有交易记录列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async getAllRecords(params?: TransactionQueryParams): Promise<PaginationResult<TransactionDTO>> {
    const result = await this.transactionRepository.findAll(params);

    return {
      list: result.list.map(toTransactionDTO),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * 统计今日入库数据
   * @returns 今日入库次数和总量
   */
  async getTodayInboundStats(): Promise<{ count: number; totalQuantity: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [count, totalQuantity] = await Promise.all([
      this.transactionRepository.countByType('IN', today, tomorrow),
      this.transactionRepository.sumQuantityByType('IN', today, tomorrow),
    ]);

    return { count, totalQuantity };
  }

  /**
   * 统计今日出库数据
   * @returns 今日出库次数和总量
   */
  async getTodayOutboundStats(): Promise<{ count: number; totalQuantity: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [count, totalQuantity] = await Promise.all([
      this.transactionRepository.countByType('OUT', today, tomorrow),
      this.transactionRepository.sumQuantityByType('OUT', today, tomorrow),
    ]);

    return { count, totalQuantity };
  }
}

export default InventoryService;
