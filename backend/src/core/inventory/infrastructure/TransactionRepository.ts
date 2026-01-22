/**
 * TransactionRepository 实现类
 * 库存交易仓储的具体实现
 */

import { PrismaClient, Prisma, TransactionType as PrismaTransactionType } from '@prisma/client';
import {
  InventoryTransaction,
  TransactionType,
} from '../domain/entities/InventoryTransaction';
import {
  ITransactionRepository,
  TransactionQueryParams,
  TransactionListItem,
} from '../domain/repositories/ITransactionRepository';
import { TransactionMapper } from '../../../shared/mappers/TransactionMapper';
import { PaginationUtil, PaginationResult } from '../../../shared/utils/pagination';

/**
 * 库存交易仓储实现类
 */
export class TransactionRepository implements ITransactionRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 将领域交易类型转换为 Prisma 交易类型
   */
  private toPrismaType(type: TransactionType): PrismaTransactionType {
    return type as PrismaTransactionType;
  }

  /**
   * 根据 ID 查找交易记录
   */
  async findById(id: number): Promise<InventoryTransaction | null> {
    const prismaTransaction = await this.prisma.inventoryTransaction.findUnique({
      where: { id },
    });

    if (!prismaTransaction) {
      return null;
    }

    const transactionData = TransactionMapper.toData(prismaTransaction);
    return InventoryTransaction.reconstruct(transactionData);
  }

  /**
   * 根据交易类型查询交易记录（分页）
   */
  async findByType(
    type: TransactionType,
    params?: TransactionQueryParams
  ): Promise<PaginationResult<TransactionListItem>> {
    const queryParams: TransactionQueryParams = {
      ...params,
      type,
    };
    return this.findAll(queryParams);
  }

  /**
   * 根据商品 ID 查询交易记录（分页）
   */
  async findByProductId(
    productId: number,
    params?: TransactionQueryParams
  ): Promise<PaginationResult<TransactionListItem>> {
    const queryParams: TransactionQueryParams = {
      ...params,
      productId,
    };
    return this.findAll(queryParams);
  }

  /**
   * 分页查询交易记录
   */
  async findAll(params?: TransactionQueryParams): Promise<PaginationResult<TransactionListItem>> {
    const paginationParams = PaginationUtil.parseParams(params?.page, params?.pageSize);
    const { skip, take } = PaginationUtil.toQuery(paginationParams);

    const where: Prisma.InventoryTransactionWhereInput = {};

    if (params?.type) {
      where.type = this.toPrismaType(params.type);
    }

    if (params?.productId) {
      where.productId = params.productId;
    }

    if (params?.sku) {
      where.sku = { contains: params.sku };
    }

    if (params?.supplierId) {
      where.supplierId = params.supplierId;
    }

    if (params?.operatorId) {
      where.operatorId = params.operatorId;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params?.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params?.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const [prismaTransactions, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          product: true,
          supplier: true,
          operator: true,
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    const transactionListItems: TransactionListItem[] = prismaTransactions.map(
      (prismaTransaction) => {
        const transactionData = TransactionMapper.toData(prismaTransaction);
        return {
          transaction: InventoryTransaction.reconstruct(transactionData),
          productName: prismaTransaction.product?.name,
          supplierName: prismaTransaction.supplier?.name,
          operatorName: prismaTransaction.operator?.username,
        };
      }
    );

    return PaginationUtil.createResult(transactionListItems, total, paginationParams);
  }

  /**
   * 保存交易记录
   */
  async save(
    transaction: InventoryTransaction,
    tx?: Prisma.TransactionClient
  ): Promise<InventoryTransaction> {
    const client = tx || this.prisma;
    const data = transaction.toData();

    const createData = {
      type: this.toPrismaType(data.type),
      productId: data.productId,
      sku: data.sku,
      quantity: data.quantity,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      supplierId: data.supplierId,
      operatorId: data.operatorId,
      remark: data.remark,
    };

    const created = await client.inventoryTransaction.create({
      data: createData,
    });

    const transactionData = TransactionMapper.toData(created);
    return InventoryTransaction.reconstruct(transactionData);
  }

  /**
   * 统计指定类型的交易数量
   */
  async countByType(
    type: TransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: Prisma.InventoryTransactionWhereInput = {
      type: this.toPrismaType(type),
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    return this.prisma.inventoryTransaction.count({ where });
  }

  /**
   * 统计指定类型的交易总量
   */
  async sumQuantityByType(
    type: TransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const where: Prisma.InventoryTransactionWhereInput = {
      type: this.toPrismaType(type),
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const result = await this.prisma.inventoryTransaction.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }
}

export default TransactionRepository;
