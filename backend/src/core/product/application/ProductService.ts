/**
 * ProductService 应用服务
 * 商品管理业务逻辑编排
 */

import { Product } from '../domain/entities/Product';
import {
  IProductRepository,
  ProductQueryParams,
  ProductListItem,
} from '../domain/repositories/IProductRepository';
import { PaginationResult } from '../../../shared/utils/pagination';

/**
 * 创建商品 DTO
 */
export interface CreateProductDTO {
  sku: string;
  name: string;
  categoryId: number;
  unit: string;
  quantity?: number;
  minThreshold?: number;
  costPrice?: number | null;
  salePrice?: number | null;
}

/**
 * 更新商品 DTO
 */
export interface UpdateProductDTO {
  name?: string;
  categoryId?: number;
  unit?: string;
  minThreshold?: number;
  costPrice?: number | null;
  salePrice?: number | null;
}

/**
 * 商品响应 DTO
 */
export interface ProductDTO {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  costPrice: number | null;
  salePrice: number | null;
  isLowStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 将 Product 实体转换为 DTO
 */
function toProductDTO(product: Product, categoryName?: string): ProductDTO {
  return {
    id: product.getId(),
    sku: product.getSku(),
    name: product.getName(),
    categoryId: product.getCategoryId(),
    categoryName,
    unit: product.getUnit(),
    quantity: product.getQuantity(),
    minThreshold: product.getMinThreshold(),
    costPrice: product.getCostPrice(),
    salePrice: product.getSalePrice(),
    isLowStock: product.isLowStock(),
    createdAt: product.getCreatedAt(),
    updatedAt: product.getUpdatedAt(),
  };
}

/**
 * 商品应用服务类
 */
export class ProductService {
  constructor(private productRepository: IProductRepository) {}

  /**
   * 获取商品列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async findAll(params: ProductQueryParams): Promise<PaginationResult<ProductDTO>> {
    const result = await this.productRepository.findAll(params);

    // 转换为 DTO
    const productDTOs = result.list.map((item: ProductListItem) =>
      toProductDTO(item.product, item.categoryName)
    );

    return {
      list: productDTOs,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  /**
   * 获取商品详情
   * @param id 商品 ID
   * @returns 商品 DTO
   */
  async findById(id: number): Promise<ProductDTO> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new Error('商品不存在');
    }

    return toProductDTO(product);
  }

  /**
   * 根据 SKU 查询商品
   * @param sku 商品 SKU
   * @returns 商品 DTO
   */
  async findBySku(sku: string): Promise<ProductDTO> {
    const product = await this.productRepository.findBySku(sku);

    if (!product) {
      throw new Error('商品不存在');
    }

    return toProductDTO(product);
  }

  /**
   * 获取低库存商品列表
   * @returns 低库存商品列表
   */
  async findLowStock(): Promise<ProductDTO[]> {
    const products = await this.productRepository.findLowStock();
    return products.map((product) => toProductDTO(product));
  }

  /**
   * 创建商品
   * @param createDTO 创建商品信息
   * @returns 商品 DTO
   */
  async create(createDTO: CreateProductDTO): Promise<ProductDTO> {
    // 验证必填字段
    if (!createDTO.sku || createDTO.sku.trim() === '') {
      throw new Error('SKU 不能为空');
    }

    if (!createDTO.name || createDTO.name.trim() === '') {
      throw new Error('商品名称不能为空');
    }

    if (!createDTO.categoryId) {
      throw new Error('分类不能为空');
    }

    if (!createDTO.unit || createDTO.unit.trim() === '') {
      throw new Error('单位不能为空');
    }

    // 检查 SKU 是否已存在
    const skuExists = await this.productRepository.existsBySku(createDTO.sku);
    if (skuExists) {
      throw new Error('SKU 已存在');
    }

    // 验证数量
    if (createDTO.quantity !== undefined && createDTO.quantity < 0) {
      throw new Error('库存数量不能为负数');
    }

    // 验证预警阈值
    if (createDTO.minThreshold !== undefined && createDTO.minThreshold < 0) {
      throw new Error('预警阈值不能为负数');
    }

    // 验证价格
    if (createDTO.costPrice !== undefined && createDTO.costPrice !== null && createDTO.costPrice < 0) {
      throw new Error('成本价不能为负数');
    }

    if (createDTO.salePrice !== undefined && createDTO.salePrice !== null && createDTO.salePrice < 0) {
      throw new Error('售价不能为负数');
    }

    // 创建商品实体
    const product = Product.create({
      sku: createDTO.sku.trim(),
      name: createDTO.name.trim(),
      categoryId: createDTO.categoryId,
      unit: createDTO.unit.trim(),
      quantity: createDTO.quantity ?? 0,
      minThreshold: createDTO.minThreshold ?? 10,
      costPrice: createDTO.costPrice ?? null,
      salePrice: createDTO.salePrice ?? null,
    });

    // 保存商品
    const savedProduct = await this.productRepository.save(product);

    return toProductDTO(savedProduct);
  }

  /**
   * 更新商品
   * @param id 商品 ID
   * @param updateDTO 更新信息
   * @returns 商品 DTO
   */
  async update(id: number, updateDTO: UpdateProductDTO): Promise<ProductDTO> {
    // 查找商品
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new Error('商品不存在');
    }

    // 更新字段
    if (updateDTO.name !== undefined) {
      if (!updateDTO.name || updateDTO.name.trim() === '') {
        throw new Error('商品名称不能为空');
      }
      product.setName(updateDTO.name.trim());
    }

    if (updateDTO.categoryId !== undefined) {
      if (!updateDTO.categoryId) {
        throw new Error('分类不能为空');
      }
      product.setCategoryId(updateDTO.categoryId);
    }

    if (updateDTO.unit !== undefined) {
      if (!updateDTO.unit || updateDTO.unit.trim() === '') {
        throw new Error('单位不能为空');
      }
      product.setUnit(updateDTO.unit.trim());
    }

    if (updateDTO.minThreshold !== undefined) {
      product.setMinThreshold(updateDTO.minThreshold);
    }

    if (updateDTO.costPrice !== undefined) {
      product.setCostPrice(updateDTO.costPrice);
    }

    if (updateDTO.salePrice !== undefined) {
      product.setSalePrice(updateDTO.salePrice);
    }

    // 保存商品
    const savedProduct = await this.productRepository.save(product);

    return toProductDTO(savedProduct);
  }

  /**
   * 删除商品（软删除）
   * @param id 商品 ID
   * @returns 是否有库存（用于前端提示）
   */
  async delete(id: number): Promise<{ hasStock: boolean }> {
    // 查找商品
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new Error('商品不存在');
    }

    const hasStock = product.hasStock();

    // 执行软删除
    await this.productRepository.delete(id);

    return { hasStock };
  }

  /**
   * 统计商品总数
   * @returns 商品总数
   */
  async count(): Promise<number> {
    return this.productRepository.count();
  }

  /**
   * 统计低库存商品数量
   * @returns 低库存商品数量
   */
  async countLowStock(): Promise<number> {
    return this.productRepository.countLowStock();
  }
}

export default ProductService;
