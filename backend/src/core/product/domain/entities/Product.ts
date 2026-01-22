/**
 * Product 实体类 (充血模型)
 * 商品领域实体，包含业务逻辑
 */

import { ProductData } from '../../../../shared/mappers/ProductMapper';

/**
 * 库存变更结果
 */
export interface StockChangeResult {
  before: number;
  after: number;
}

/**
 * 商品实体类
 * 采用充血模型，包含业务逻辑方法
 */
export class Product {
  private id: number;
  private sku: string;
  private name: string;
  private categoryId: number;
  private unit: string;
  private quantity: number;
  private minThreshold: number;
  private costPrice: number | null;
  private salePrice: number | null;
  private version: number;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  /**
   * 私有构造函数，使用静态工厂方法创建实例
   */
  private constructor() {
    this.id = 0;
    this.sku = '';
    this.name = '';
    this.categoryId = 0;
    this.unit = '';
    this.quantity = 0;
    this.minThreshold = 10;
    this.costPrice = null;
    this.salePrice = null;
    this.version = 1;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  /**
   * 静态工厂方法：从 Prisma POJO 重建领域实体
   * @param data ProductData 数据对象
   * @returns Product 实体实例
   */
  static reconstruct(data: ProductData): Product {
    const product = new Product();
    product.id = data.id;
    product.sku = data.sku;
    product.name = data.name;
    product.categoryId = data.categoryId;
    product.unit = data.unit;
    product.quantity = data.quantity;
    product.minThreshold = data.minThreshold;
    product.costPrice = data.costPrice;
    product.salePrice = data.salePrice;
    product.version = data.version;
    product.createdAt = data.createdAt;
    product.updatedAt = data.updatedAt;
    product.deletedAt = data.deletedAt;
    return product;
  }

  /**
   * 静态工厂方法：创建新商品
   * @param params 创建参数
   * @returns Product 实体实例
   */
  static create(params: {
    sku: string;
    name: string;
    categoryId: number;
    unit: string;
    quantity?: number;
    minThreshold?: number;
    costPrice?: number | null;
    salePrice?: number | null;
  }): Product {
    const product = new Product();
    product.sku = params.sku;
    product.name = params.name;
    product.categoryId = params.categoryId;
    product.unit = params.unit;
    product.quantity = params.quantity ?? 0;
    product.minThreshold = params.minThreshold ?? 10;
    product.costPrice = params.costPrice ?? null;
    product.salePrice = params.salePrice ?? null;
    product.version = 1;
    product.createdAt = new Date();
    product.updatedAt = new Date();
    product.deletedAt = null;
    return product;
  }

  // ============================================
  // Getter 方法
  // ============================================

  getId(): number {
    return this.id;
  }

  getSku(): string {
    return this.sku;
  }

  getName(): string {
    return this.name;
  }

  getCategoryId(): number {
    return this.categoryId;
  }

  getUnit(): string {
    return this.unit;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getMinThreshold(): number {
    return this.minThreshold;
  }

  getCostPrice(): number | null {
    return this.costPrice;
  }

  getSalePrice(): number | null {
    return this.salePrice;
  }

  getVersion(): number {
    return this.version;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  // ============================================
  // Setter 方法（用于更新操作）
  // ============================================

  setName(name: string): void {
    this.name = name;
    this.updatedAt = new Date();
  }

  setCategoryId(categoryId: number): void {
    this.categoryId = categoryId;
    this.updatedAt = new Date();
  }

  setUnit(unit: string): void {
    this.unit = unit;
    this.updatedAt = new Date();
  }

  setMinThreshold(minThreshold: number): void {
    if (minThreshold < 0) {
      throw new Error('预警阈值不能为负数');
    }
    this.minThreshold = minThreshold;
    this.updatedAt = new Date();
  }

  setCostPrice(costPrice: number | null): void {
    if (costPrice !== null && costPrice < 0) {
      throw new Error('成本价不能为负数');
    }
    this.costPrice = costPrice;
    this.updatedAt = new Date();
  }

  setSalePrice(salePrice: number | null): void {
    if (salePrice !== null && salePrice < 0) {
      throw new Error('售价不能为负数');
    }
    this.salePrice = salePrice;
    this.updatedAt = new Date();
  }

  // ============================================
  // 业务方法
  // ============================================

  /**
   * 调整库存数量
   * @param change 变化量（正数为增加，负数为减少）
   * @throws Error 如果调整后库存为负数
   */
  adjustStock(change: number): void {
    const newQuantity = this.quantity + change;
    if (newQuantity < 0) {
      throw new Error('库存不足');
    }
    this.quantity = newQuantity;
    this.updatedAt = new Date();
  }

  /**
   * 判断是否为低库存
   * @returns 如果库存数量 <= 预警阈值，返回 true
   */
  isLowStock(): boolean {
    return this.quantity <= this.minThreshold;
  }

  /**
   * 判断是否可以出库指定数量
   * @param quantity 出库数量
   * @returns 如果当前库存 >= 出库数量，返回 true
   */
  canOutbound(quantity: number): boolean {
    return this.quantity >= quantity;
  }

  /**
   * 入库操作
   * @param quantity 入库数量（必须为正整数）
   * @returns 库存变更结果（变更前后的库存数量）
   * @throws Error 如果入库数量不是正整数
   */
  inbound(quantity: number): StockChangeResult {
    if (quantity <= 0) {
      throw new Error('入库数量必须为正整数');
    }
    if (!Number.isInteger(quantity)) {
      throw new Error('入库数量必须为整数');
    }
    const before = this.quantity;
    this.adjustStock(quantity);
    return { before, after: this.quantity };
  }

  /**
   * 出库操作
   * @param quantity 出库数量（必须为正整数）
   * @returns 库存变更结果（变更前后的库存数量）
   * @throws Error 如果出库数量不是正整数或库存不足
   */
  outbound(quantity: number): StockChangeResult {
    if (quantity <= 0) {
      throw new Error('出库数量必须为正整数');
    }
    if (!Number.isInteger(quantity)) {
      throw new Error('出库数量必须为整数');
    }
    if (!this.canOutbound(quantity)) {
      throw new Error('库存不足，无法出库');
    }
    const before = this.quantity;
    this.adjustStock(-quantity);
    return { before, after: this.quantity };
  }

  /**
   * 软删除商品
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 判断商品是否已删除
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * 判断商品是否有库存
   */
  hasStock(): boolean {
    return this.quantity > 0;
  }

  /**
   * 转换为普通对象（用于持久化）
   */
  toData(): ProductData {
    return {
      id: this.id,
      sku: this.sku,
      name: this.name,
      categoryId: this.categoryId,
      unit: this.unit,
      quantity: this.quantity,
      minThreshold: this.minThreshold,
      costPrice: this.costPrice,
      salePrice: this.salePrice,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

export default Product;
