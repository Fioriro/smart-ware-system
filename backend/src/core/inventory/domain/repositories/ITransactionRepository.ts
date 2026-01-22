/**
 * ITransactionRepository 接口
 * 库存交易仓储接口定义
 */

import { InventoryTransaction, TransactionType } from '../entities/InventoryTransaction';
import { PaginationResult } from '../../../../shared/utils/pagination';
import { Prisma } from '@prisma/client';

/**
 * 交易查询参数
 */
export interface TransactionQueryParams {
  page?: number;
  pageSize?: number;
  type?: TransactionType;           // 交易类型筛选
  productId?: number;               // 商品 ID 筛选
  sku?: string;                     // SKU 搜索
  supplierId?: number;              // 供应商 ID 筛选
  operatorId?: number;              // 操作人 ID 筛选
  startDate?: Date;                 // 开始时间
  endDate?: Date;                   // 结束时间
}

/**
 * 交易列表项（包含关联信息）
 */
export interface TransactionListItem {
  transaction: InventoryTransaction;
  productName?: string;
  supplierName?: string;
  operatorName?: string;
}

/**
 * 库存交易仓储接口
 * 定义库存交易持久化操作的抽象接口
 */
export interface ITransactionRepository {
  /**
   * 根据 ID 查找交易记录
   * @param id 交易 ID
   * @returns 交易实体或 null
   */
  findById(id: number): Promise<InventoryTransaction | null>;

  /**
   * 根据交易类型查询交易记录（分页）
   * @param type 交易类型
   * @param params 查询参数
   * @returns 分页结果
   */
  findByType(
    type: TransactionType,
    params?: TransactionQueryParams
  ): Promise<PaginationResult<TransactionListItem>>;

  /**
   * 根据商品 ID 查询交易记录（分页）
   * @param productId 商品 ID
   * @param params 查询参数
   * @returns 分页结果
   */
  findByProductId(
    productId: number,
    params?: TransactionQueryParams
  ): Promise<PaginationResult<TransactionListItem>>;

  /**
   * 分页查询交易记录
   * @param params 查询参数
   * @returns 分页结果
   */
  findAll(params?: TransactionQueryParams): Promise<PaginationResult<TransactionListItem>>;

  /**
   * 保存交易记录
   * @param transaction 交易实体
   * @param tx 可选的事务客户端
   * @returns 保存后的交易实体
   */
  save(
    transaction: InventoryTransaction,
    tx?: Prisma.TransactionClient
  ): Promise<InventoryTransaction>;

  /**
   * 统计指定类型的交易数量
   * @param type 交易类型
   * @param startDate 开始时间（可选）
   * @param endDate 结束时间（可选）
   * @returns 交易数量
   */
  countByType(
    type: TransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number>;

  /**
   * 统计指定类型的交易总量
   * @param type 交易类型
   * @param startDate 开始时间（可选）
   * @param endDate 结束时间（可选）
   * @returns 交易总量
   */
  sumQuantityByType(
    type: TransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number>;
}

export default ITransactionRepository;
