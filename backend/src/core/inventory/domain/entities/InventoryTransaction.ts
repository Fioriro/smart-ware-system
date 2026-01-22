/**
 * InventoryTransaction 实体类
 * 库存交易领域实体，记录入库、出库、调整等操作
 */

/**
 * 交易类型
 */
export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';

/**
 * 入库参数
 */
export interface InboundParams {
  productId: number;
  sku: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  supplierId: number | null;
  operatorId: number;
  remark?: string | null;
}

/**
 * 出库参数
 */
export interface OutboundParams {
  productId: number;
  sku: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  operatorId: number;
  remark?: string | null;
}

/**
 * 调整参数
 */
export interface AdjustmentParams {
  productId: number;
  sku: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  operatorId: number;
  remark?: string | null;
}

/**
 * 交易数据对象（用于持久化）
 */
export interface TransactionData {
  id: number;
  type: TransactionType;
  productId: number;
  sku: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  supplierId: number | null;
  operatorId: number;
  remark: string | null;
  createdAt: Date;
}

/**
 * 库存交易实体类
 */
export class InventoryTransaction {
  private id: number;
  private type: TransactionType;
  private productId: number;
  private sku: string;
  private quantity: number;
  private quantityBefore: number;
  private quantityAfter: number;
  private supplierId: number | null;
  private operatorId: number;
  private remark: string | null;
  private createdAt: Date;

  /**
   * 私有构造函数，使用静态工厂方法创建实例
   */
  private constructor(params: {
    id?: number;
    type: TransactionType;
    productId: number;
    sku: string;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    supplierId: number | null;
    operatorId: number;
    remark?: string | null;
    createdAt?: Date;
  }) {
    this.id = params.id ?? 0;
    this.type = params.type;
    this.productId = params.productId;
    this.sku = params.sku;
    this.quantity = params.quantity;
    this.quantityBefore = params.quantityBefore;
    this.quantityAfter = params.quantityAfter;
    this.supplierId = params.supplierId;
    this.operatorId = params.operatorId;
    this.remark = params.remark ?? null;
    this.createdAt = params.createdAt ?? new Date();
  }

  // ============================================
  // 静态工厂方法
  // ============================================

  /**
   * 创建入库交易记录
   * @param params 入库参数
   * @returns InventoryTransaction 实体实例
   */
  static createInbound(params: InboundParams): InventoryTransaction {
    if (params.quantity <= 0) {
      throw new Error('入库数量必须为正整数');
    }
    if (!Number.isInteger(params.quantity)) {
      throw new Error('入库数量必须为整数');
    }

    return new InventoryTransaction({
      type: 'IN',
      productId: params.productId,
      sku: params.sku,
      quantity: params.quantity,
      quantityBefore: params.quantityBefore,
      quantityAfter: params.quantityAfter,
      supplierId: params.supplierId,
      operatorId: params.operatorId,
      remark: params.remark,
    });
  }

  /**
   * 创建出库交易记录
   * @param params 出库参数
   * @returns InventoryTransaction 实体实例
   */
  static createOutbound(params: OutboundParams): InventoryTransaction {
    if (params.quantity <= 0) {
      throw new Error('出库数量必须为正整数');
    }
    if (!Number.isInteger(params.quantity)) {
      throw new Error('出库数量必须为整数');
    }

    return new InventoryTransaction({
      type: 'OUT',
      productId: params.productId,
      sku: params.sku,
      quantity: params.quantity,
      quantityBefore: params.quantityBefore,
      quantityAfter: params.quantityAfter,
      supplierId: null,
      operatorId: params.operatorId,
      remark: params.remark,
    });
  }

  /**
   * 创建库存调整交易记录
   * @param params 调整参数
   * @returns InventoryTransaction 实体实例
   */
  static createAdjustment(params: AdjustmentParams): InventoryTransaction {
    if (params.quantity === 0) {
      throw new Error('调整数量不能为零');
    }
    if (!Number.isInteger(params.quantity)) {
      throw new Error('调整数量必须为整数');
    }

    return new InventoryTransaction({
      type: 'ADJUSTMENT',
      productId: params.productId,
      sku: params.sku,
      quantity: Math.abs(params.quantity),
      quantityBefore: params.quantityBefore,
      quantityAfter: params.quantityAfter,
      supplierId: null,
      operatorId: params.operatorId,
      remark: params.remark,
    });
  }

  /**
   * 从数据库数据重建实体
   * @param data TransactionData 数据对象
   * @returns InventoryTransaction 实体实例
   */
  static reconstruct(data: TransactionData): InventoryTransaction {
    return new InventoryTransaction({
      id: data.id,
      type: data.type,
      productId: data.productId,
      sku: data.sku,
      quantity: data.quantity,
      quantityBefore: data.quantityBefore,
      quantityAfter: data.quantityAfter,
      supplierId: data.supplierId,
      operatorId: data.operatorId,
      remark: data.remark,
      createdAt: data.createdAt,
    });
  }

  // ============================================
  // Getter 方法
  // ============================================

  getId(): number {
    return this.id;
  }

  getType(): TransactionType {
    return this.type;
  }

  getProductId(): number {
    return this.productId;
  }

  getSku(): string {
    return this.sku;
  }

  getQuantity(): number {
    return this.quantity;
  }

  getQuantityBefore(): number {
    return this.quantityBefore;
  }

  getQuantityAfter(): number {
    return this.quantityAfter;
  }

  getSupplierId(): number | null {
    return this.supplierId;
  }

  getOperatorId(): number {
    return this.operatorId;
  }

  getRemark(): string | null {
    return this.remark;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  // ============================================
  // 业务方法
  // ============================================

  /**
   * 判断是否为入库交易
   */
  isInbound(): boolean {
    return this.type === 'IN';
  }

  /**
   * 判断是否为出库交易
   */
  isOutbound(): boolean {
    return this.type === 'OUT';
  }

  /**
   * 判断是否为调整交易
   */
  isAdjustment(): boolean {
    return this.type === 'ADJUSTMENT';
  }

  /**
   * 获取库存变化量（正数为增加，负数为减少）
   */
  getQuantityChange(): number {
    return this.quantityAfter - this.quantityBefore;
  }

  /**
   * 转换为数据对象（用于持久化）
   */
  toData(): TransactionData {
    return {
      id: this.id,
      type: this.type,
      productId: this.productId,
      sku: this.sku,
      quantity: this.quantity,
      quantityBefore: this.quantityBefore,
      quantityAfter: this.quantityAfter,
      supplierId: this.supplierId,
      operatorId: this.operatorId,
      remark: this.remark,
      createdAt: this.createdAt,
    };
  }
}

export default InventoryTransaction;
