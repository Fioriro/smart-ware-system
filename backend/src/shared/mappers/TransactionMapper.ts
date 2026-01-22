/**
 * TransactionMapper - Prisma POJO to Domain Entity converter
 * 库存交易数据映射器
 */

import {
  InventoryTransaction as PrismaTransaction,
  Product as PrismaProduct,
  Supplier as PrismaSupplier,
  User as PrismaUser,
  TransactionType as PrismaTransactionType,
} from '@prisma/client';
import { TransactionData, TransactionType } from '../../core/inventory/domain/entities/InventoryTransaction';

/**
 * Prisma 交易记录（包含关联数据）
 */
export type PrismaTransactionWithRelations = PrismaTransaction & {
  product?: PrismaProduct;
  supplier?: PrismaSupplier | null;
  operator?: PrismaUser;
};

/**
 * 交易列表项数据
 */
export interface TransactionListItemData extends TransactionData {
  productName?: string;
  supplierName?: string;
  operatorName?: string;
}

/**
 * 库存交易数据映射器
 */
export class TransactionMapper {
  /**
   * 将 Prisma 交易类型转换为领域交易类型
   */
  private static mapTransactionType(prismaType: PrismaTransactionType): TransactionType {
    switch (prismaType) {
      case 'IN':
        return 'IN';
      case 'OUT':
        return 'OUT';
      case 'ADJUSTMENT':
        return 'ADJUSTMENT';
      default:
        throw new Error(`Unknown transaction type: ${prismaType}`);
    }
  }

  /**
   * 将 Prisma 交易记录转换为领域数据对象
   * @param prismaTransaction Prisma 交易记录
   * @returns TransactionData 数据对象
   */
  static toData(prismaTransaction: PrismaTransaction): TransactionData {
    return {
      id: prismaTransaction.id,
      type: this.mapTransactionType(prismaTransaction.type),
      productId: prismaTransaction.productId,
      sku: prismaTransaction.sku,
      quantity: prismaTransaction.quantity,
      quantityBefore: prismaTransaction.quantityBefore,
      quantityAfter: prismaTransaction.quantityAfter,
      supplierId: prismaTransaction.supplierId,
      operatorId: prismaTransaction.operatorId,
      remark: prismaTransaction.remark,
      createdAt: prismaTransaction.createdAt,
    };
  }

  /**
   * 将 Prisma 交易记录（含关联）转换为列表项数据
   * @param prismaTransaction Prisma 交易记录（含关联）
   * @returns TransactionListItemData 列表项数据
   */
  static toListItemData(prismaTransaction: PrismaTransactionWithRelations): TransactionListItemData {
    const baseData = this.toData(prismaTransaction);
    return {
      ...baseData,
      productName: prismaTransaction.product?.name,
      supplierName: prismaTransaction.supplier?.name,
      operatorName: prismaTransaction.operator?.username,
    };
  }

  /**
   * 批量转换为数据对象列表
   * @param prismaTransactions Prisma 交易记录列表
   * @returns TransactionData 数据对象列表
   */
  static toDataList(prismaTransactions: PrismaTransaction[]): TransactionData[] {
    return prismaTransactions.map((transaction) => this.toData(transaction));
  }

  /**
   * 批量转换为列表项数据列表
   * @param prismaTransactions Prisma 交易记录列表（含关联）
   * @returns TransactionListItemData 列表项数据列表
   */
  static toListItemDataList(
    prismaTransactions: PrismaTransactionWithRelations[]
  ): TransactionListItemData[] {
    return prismaTransactions.map((transaction) => this.toListItemData(transaction));
  }
}

export default TransactionMapper;
