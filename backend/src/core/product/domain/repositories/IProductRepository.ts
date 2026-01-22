/**
 * IProductRepository 接口
 * 商品仓储接口定义
 */

import { Product } from '../entities/Product';
import { PaginationResult } from '../../../../shared/utils/pagination';

/**
 * 商品查询参数
 */
export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;      // 搜索关键字（SKU 或名称）
  categoryId?: number;   // 分类 ID 筛选
  lowStockOnly?: boolean; // 仅显示低库存
}

/**
 * 商品列表项（包含分类名称）
 */
export interface ProductListItem {
  product: Product;
  categoryName?: string;
}

/**
 * Prisma 事务客户端类型
 */
export type PrismaTransactionClient = {
  product: {
    updateMany: (args: {
      where: { id: number; version: number };
      data: { quantity: number; version: { increment: number } };
    }) => Promise<{ count: number }>;
    update: (args: {
      where: { id: number };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    create: (args: {
      data: Record<string, unknown>;
    }) => Promise<unknown>;
  };
};

/**
 * 商品仓储接口
 * 定义商品持久化操作的抽象接口
 */
export interface IProductRepository {
  /**
   * 根据 ID 查找商品
   * @param id 商品 ID
   * @returns 商品实体或 null
   */
  findById(id: number): Promise<Product | null>;

  /**
   * 根据 SKU 查找商品
   * @param sku 商品 SKU
   * @returns 商品实体或 null
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * 分页查询商品列表
   * @param params 查询参数
   * @returns 分页结果
   */
  findAll(params: ProductQueryParams): Promise<PaginationResult<ProductListItem>>;

  /**
   * 查询低库存商品列表
   * @returns 低库存商品列表
   */
  findLowStock(): Promise<Product[]>;

  /**
   * 保存商品（新增或更新）
   * @param product 商品实体
   * @param tx 可选的事务客户端
   * @returns 保存后的商品实体
   */
  save(product: Product, tx?: PrismaTransactionClient): Promise<Product>;

  /**
   * 删除商品（软删除）
   * @param id 商品 ID
   */
  delete(id: number): Promise<void>;

  /**
   * 检查 SKU 是否已存在
   * @param sku SKU 编码
   * @param excludeId 排除的商品 ID（用于更新时检查）
   * @returns 是否存在
   */
  existsBySku(sku: string, excludeId?: number): Promise<boolean>;

  /**
   * 统计商品总数
   * @returns 商品总数
   */
  count(): Promise<number>;

  /**
   * 统计低库存商品数量
   * @returns 低库存商品数量
   */
  countLowStock(): Promise<number>;
}

export default IProductRepository;
