/**
 * ProductRepository 实现类
 * 商品仓储的具体实现
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Product } from '../domain/entities/Product';
import {
  IProductRepository,
  ProductQueryParams,
  ProductListItem,
  PrismaTransactionClient,
} from '../domain/repositories/IProductRepository';
import { ProductMapper, ProductData } from '../../../shared/mappers/ProductMapper';
import { PaginationUtil, PaginationResult } from '../../../shared/utils/pagination';

/**
 * 商品仓储实现类
 */
export class ProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * 根据 ID 查找商品
   */
  async findById(id: number): Promise<Product | null> {
    const prismaProduct = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!prismaProduct) {
      return null;
    }

    const productData = ProductMapper.toData(prismaProduct);
    return Product.reconstruct(productData);
  }

  /**
   * 根据 SKU 查找商品
   */
  async findBySku(sku: string): Promise<Product | null> {
    const prismaProduct = await this.prisma.product.findFirst({
      where: {
        sku,
        deletedAt: null,
      },
    });

    if (!prismaProduct) {
      return null;
    }

    const productData = ProductMapper.toData(prismaProduct);
    return Product.reconstruct(productData);
  }

  /**
   * 分页查询商品列表
   * 优化：使用 select 只获取需要的字段，减少数据传输
   */
  async findAll(params: ProductQueryParams): Promise<PaginationResult<ProductListItem>> {
    const paginationParams = PaginationUtil.parseParams(params.page, params.pageSize);
    const { skip, take } = PaginationUtil.toQuery(paginationParams);

    // 构建查询条件
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    // 关键字搜索（SKU 或名称）
    if (params.keyword) {
      where.OR = [
        { sku: { contains: params.keyword } },
        { name: { contains: params.keyword } },
      ];
    }

    // 分类筛选
    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    // 低库存筛选 - 需要特殊处理，因为 Prisma 不支持直接比较两个字段
    if (params.lowStockOnly) {
      // 先获取低库存商品的 ID 列表
      const lowStockIds = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM products 
        WHERE deleted_at IS NULL 
        AND quantity <= min_threshold
      `;
      
      if (lowStockIds.length === 0) {
        // 没有低库存商品，返回空结果
        return PaginationUtil.createResult([], 0, paginationParams);
      }
      
      where.id = {
        in: lowStockIds.map(item => item.id),
      };
    }

    // 并行查询商品列表和总数（优化：使用 Promise.all 并行执行）
    const [prismaProducts, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        // 优化：使用 include 一次性获取关联数据，避免 N+1 查询
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    // 转换为领域实体
    const productListItems: ProductListItem[] = prismaProducts.map((prismaProduct) => {
      const productData = ProductMapper.toData(prismaProduct);
      return {
        product: Product.reconstruct(productData),
        categoryName: prismaProduct.category?.name,
      };
    });

    return PaginationUtil.createResult(productListItems, total, paginationParams);
  }

  /**
   * 查询低库存商品列表
   */
  async findLowStock(): Promise<Product[]> {
    // 使用原始 SQL 查询低库存商品（quantity <= minThreshold）
    const prismaProducts = await this.prisma.$queryRaw<Array<{
      id: number;
      sku: string;
      name: string;
      category_id: number;
      unit: string;
      quantity: number;
      min_threshold: number;
      cost_price: Prisma.Decimal | null;
      sale_price: Prisma.Decimal | null;
      version: number;
      created_at: Date;
      updated_at: Date;
      deleted_at: Date | null;
    }>>`
      SELECT * FROM products 
      WHERE deleted_at IS NULL 
      AND quantity <= min_threshold
      ORDER BY quantity ASC
    `;

    return prismaProducts.map((row) => {
      const productData: ProductData = {
        id: row.id,
        sku: row.sku,
        name: row.name,
        categoryId: row.category_id,
        unit: row.unit,
        quantity: row.quantity,
        minThreshold: row.min_threshold,
        costPrice: row.cost_price ? Number(row.cost_price) : null,
        salePrice: row.sale_price ? Number(row.sale_price) : null,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
      };
      return Product.reconstruct(productData);
    });
  }

  /**
   * 保存商品（新增或更新，含乐观锁）
   */
  async save(product: Product, _tx?: PrismaTransactionClient): Promise<Product> {
    const data = product.toData();

    if (data.id === 0) {
      // 新增商品
      const createData = {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        quantity: data.quantity,
        minThreshold: data.minThreshold,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        version: 1,
      };

      const created = await this.prisma.product.create({
        data: createData,
      });

      const productData = ProductMapper.toData(created);
      return Product.reconstruct(productData);
    } else {
      // 更新商品（使用乐观锁）
      const currentVersion = data.version;

      // 使用乐观锁更新
      const updateResult = await this.prisma.product.updateMany({
        where: {
          id: data.id,
          version: currentVersion,
          deletedAt: null,
        },
        data: {
          name: data.name,
          categoryId: data.categoryId,
          unit: data.unit,
          quantity: data.quantity,
          minThreshold: data.minThreshold,
          costPrice: data.costPrice,
          salePrice: data.salePrice,
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      if (updateResult.count === 0) {
        throw new Error('并发冲突，请重试');
      }

      // 重新查询更新后的商品
      const updated = await this.prisma.product.findUnique({
        where: { id: data.id },
      });

      if (!updated) {
        throw new Error('商品不存在');
      }

      const productData = ProductMapper.toData(updated);
      return Product.reconstruct(productData);
    }
  }

  /**
   * 删除商品（软删除）
   */
  async delete(id: number): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new Error('商品不存在');
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 检查 SKU 是否已存在
   */
  async existsBySku(sku: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.ProductWhereInput = {
      sku,
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await this.prisma.product.count({ where });
    return count > 0;
  }

  /**
   * 统计商品总数
   */
  async count(): Promise<number> {
    return this.prisma.product.count({
      where: { deletedAt: null },
    });
  }

  /**
   * 统计低库存商品数量
   */
  async countLowStock(): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM products 
      WHERE deleted_at IS NULL 
      AND quantity <= min_threshold
    `;
    return Number(result[0].count);
  }

  /**
   * 使用乐观锁更新库存（用于入库/出库操作）
   * @param id 商品 ID
   * @param newQuantity 新库存数量
   * @param currentVersion 当前版本号
   * @param tx 可选的事务客户端
   * @returns 更新是否成功
   */
  async updateStockWithOptimisticLock(
    id: number,
    newQuantity: number,
    currentVersion: number,
    tx?: Prisma.TransactionClient
  ): Promise<boolean> {
    const client = tx || this.prisma;

    const result = await client.product.updateMany({
      where: {
        id,
        version: currentVersion,
        deletedAt: null,
      },
      data: {
        quantity: newQuantity,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return result.count > 0;
  }
}

export default ProductRepository;
