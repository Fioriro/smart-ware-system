/**
 * ProductMapper - Prisma POJO to Domain Entity converter
 */

import { Product as PrismaProduct, Category as PrismaCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProductData {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  unit: string;
  quantity: number;
  minThreshold: number;
  costPrice: number | null;
  salePrice: number | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProductListItemData extends ProductData {
  categoryName?: string;
}

export type PrismaProductWithCategory = PrismaProduct & {
  category?: PrismaCategory;
};

export class ProductMapper {
  private static decimalToNumber(decimal: Decimal | null): number | null {
    if (decimal === null) {
      return null;
    }
    return decimal.toNumber();
  }

  static toData(prismaProduct: PrismaProduct): ProductData {
    return {
      id: prismaProduct.id,
      sku: prismaProduct.sku,
      name: prismaProduct.name,
      categoryId: prismaProduct.categoryId,
      unit: prismaProduct.unit,
      quantity: prismaProduct.quantity,
      minThreshold: prismaProduct.minThreshold,
      costPrice: this.decimalToNumber(prismaProduct.costPrice),
      salePrice: this.decimalToNumber(prismaProduct.salePrice),
      version: prismaProduct.version,
      createdAt: prismaProduct.createdAt,
      updatedAt: prismaProduct.updatedAt,
      deletedAt: prismaProduct.deletedAt,
    };
  }

  static toListItemData(prismaProduct: PrismaProductWithCategory): ProductListItemData {
    const baseData = this.toData(prismaProduct);
    return {
      ...baseData,
      categoryName: prismaProduct.category?.name,
    };
  }

  static toDataList(prismaProducts: PrismaProduct[]): ProductData[] {
    return prismaProducts.map((product) => this.toData(product));
  }

  static toListItemDataList(prismaProducts: PrismaProductWithCategory[]): ProductListItemData[] {
    return prismaProducts.map((product) => this.toListItemData(product));
  }
}
