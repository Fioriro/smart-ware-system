/**
 * 库存管理模块单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InventoryTransaction } from './domain/entities/InventoryTransaction';
import { InventoryService, InboundCommand, OutboundCommand, BatchInboundCommand } from './application/InventoryService';
import { ITransactionRepository, TransactionListItem } from './domain/repositories/ITransactionRepository';
import { IProductRepository } from '../product/domain/repositories/IProductRepository';
import { Product } from '../product/domain/entities/Product';
import { PrismaClient } from '@prisma/client';
import { PaginationResult } from '../../shared/utils/pagination';

// ============================================
// InventoryTransaction 实体测试
// ============================================

describe('InventoryTransaction Entity', () => {
  describe('createInbound', () => {
    it('应该成功创建入库交易记录', () => {
      const transaction = InventoryTransaction.createInbound({
        productId: 1,
        sku: 'SKU001',
        quantity: 10,
        quantityBefore: 100,
        quantityAfter: 110,
        supplierId: 1,
        operatorId: 1,
        remark: '测试入库',
      });

      expect(transaction.getType()).toBe('IN');
      expect(transaction.getProductId()).toBe(1);
      expect(transaction.getSku()).toBe('SKU001');
      expect(transaction.getQuantity()).toBe(10);
      expect(transaction.getQuantityBefore()).toBe(100);
      expect(transaction.getQuantityAfter()).toBe(110);
      expect(transaction.getSupplierId()).toBe(1);
      expect(transaction.getOperatorId()).toBe(1);
      expect(transaction.getRemark()).toBe('测试入库');
      expect(transaction.isInbound()).toBe(true);
      expect(transaction.isOutbound()).toBe(false);
    });

    it('入库数量为零时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createInbound({
          productId: 1,
          sku: 'SKU001',
          quantity: 0,
          quantityBefore: 100,
          quantityAfter: 100,
          supplierId: 1,
          operatorId: 1,
        });
      }).toThrow('入库数量必须为正整数');
    });

    it('入库数量为负数时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createInbound({
          productId: 1,
          sku: 'SKU001',
          quantity: -5,
          quantityBefore: 100,
          quantityAfter: 95,
          supplierId: 1,
          operatorId: 1,
        });
      }).toThrow('入库数量必须为正整数');
    });

    it('入库数量为小数时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createInbound({
          productId: 1,
          sku: 'SKU001',
          quantity: 10.5,
          quantityBefore: 100,
          quantityAfter: 110.5,
          supplierId: 1,
          operatorId: 1,
        });
      }).toThrow('入库数量必须为整数');
    });
  });

  describe('createOutbound', () => {
    it('应该成功创建出库交易记录', () => {
      const transaction = InventoryTransaction.createOutbound({
        productId: 1,
        sku: 'SKU001',
        quantity: 5,
        quantityBefore: 100,
        quantityAfter: 95,
        operatorId: 1,
        remark: '测试出库',
      });

      expect(transaction.getType()).toBe('OUT');
      expect(transaction.getQuantity()).toBe(5);
      expect(transaction.getSupplierId()).toBeNull();
      expect(transaction.isOutbound()).toBe(true);
      expect(transaction.isInbound()).toBe(false);
    });

    it('出库数量为零时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createOutbound({
          productId: 1,
          sku: 'SKU001',
          quantity: 0,
          quantityBefore: 100,
          quantityAfter: 100,
          operatorId: 1,
        });
      }).toThrow('出库数量必须为正整数');
    });

    it('出库数量为负数时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createOutbound({
          productId: 1,
          sku: 'SKU001',
          quantity: -5,
          quantityBefore: 100,
          quantityAfter: 105,
          operatorId: 1,
        });
      }).toThrow('出库数量必须为正整数');
    });
  });

  describe('createAdjustment', () => {
    it('应该成功创建调整交易记录', () => {
      const transaction = InventoryTransaction.createAdjustment({
        productId: 1,
        sku: 'SKU001',
        quantity: 5,
        quantityBefore: 100,
        quantityAfter: 105,
        operatorId: 1,
        remark: '盘点调整',
      });

      expect(transaction.getType()).toBe('ADJUSTMENT');
      expect(transaction.getQuantity()).toBe(5);
      expect(transaction.isAdjustment()).toBe(true);
    });

    it('调整数量为零时应该抛出错误', () => {
      expect(() => {
        InventoryTransaction.createAdjustment({
          productId: 1,
          sku: 'SKU001',
          quantity: 0,
          quantityBefore: 100,
          quantityAfter: 100,
          operatorId: 1,
        });
      }).toThrow('调整数量不能为零');
    });
  });

  describe('getQuantityChange', () => {
    it('入库时应该返回正数变化量', () => {
      const transaction = InventoryTransaction.createInbound({
        productId: 1,
        sku: 'SKU001',
        quantity: 10,
        quantityBefore: 100,
        quantityAfter: 110,
        supplierId: 1,
        operatorId: 1,
      });

      expect(transaction.getQuantityChange()).toBe(10);
    });

    it('出库时应该返回负数变化量', () => {
      const transaction = InventoryTransaction.createOutbound({
        productId: 1,
        sku: 'SKU001',
        quantity: 5,
        quantityBefore: 100,
        quantityAfter: 95,
        operatorId: 1,
      });

      expect(transaction.getQuantityChange()).toBe(-5);
    });
  });

  describe('reconstruct', () => {
    it('应该从数据对象重建实体', () => {
      const data = {
        id: 1,
        type: 'IN' as const,
        productId: 1,
        sku: 'SKU001',
        quantity: 10,
        quantityBefore: 100,
        quantityAfter: 110,
        supplierId: 1,
        operatorId: 1,
        remark: '测试',
        createdAt: new Date(),
      };

      const transaction = InventoryTransaction.reconstruct(data);

      expect(transaction.getId()).toBe(1);
      expect(transaction.getType()).toBe('IN');
      expect(transaction.getSku()).toBe('SKU001');
    });
  });

  describe('toData', () => {
    it('应该正确转换为数据对象', () => {
      const transaction = InventoryTransaction.createInbound({
        productId: 1,
        sku: 'SKU001',
        quantity: 10,
        quantityBefore: 100,
        quantityAfter: 110,
        supplierId: 1,
        operatorId: 1,
        remark: '测试',
      });

      const data = transaction.toData();

      expect(data.type).toBe('IN');
      expect(data.productId).toBe(1);
      expect(data.sku).toBe('SKU001');
      expect(data.quantity).toBe(10);
    });
  });
});

// ============================================
// InventoryService 应用服务测试
// ============================================

describe('InventoryService', () => {
  let inventoryService: InventoryService;
  let mockPrisma: PrismaClient;
  let mockProductRepository: IProductRepository;
  let mockTransactionRepository: ITransactionRepository;

  // 创建模拟商品
  const createMockProduct = (quantity: number = 100, version: number = 1) => {
    return Product.reconstruct({
      id: 1,
      sku: 'SKU001',
      name: '测试商品',
      categoryId: 1,
      unit: '个',
      quantity,
      minThreshold: 10,
      costPrice: 10,
      salePrice: 20,
      version,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });
  };

  beforeEach(() => {
    // 创建模拟的 Prisma 客户端
    mockPrisma = {
      $transaction: vi.fn(async (callback) => {
        const mockTx = {
          product: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
          inventoryTransaction: {
            create: vi.fn().mockResolvedValue({
              id: 1,
              type: 'IN',
              productId: 1,
              sku: 'SKU001',
              quantity: 10,
              quantityBefore: 100,
              quantityAfter: 110,
              supplierId: 1,
              operatorId: 1,
              remark: null,
              createdAt: new Date(),
            }),
          },
        };
        return callback(mockTx);
      }),
    } as unknown as PrismaClient;

    // 创建模拟的商品仓储
    mockProductRepository = {
      findById: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      findLowStock: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      existsBySku: vi.fn(),
      count: vi.fn(),
      countLowStock: vi.fn(),
    };

    // 创建模拟的交易仓储
    mockTransactionRepository = {
      findById: vi.fn(),
      findByType: vi.fn(),
      findByProductId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation(async (transaction) => {
        return InventoryTransaction.reconstruct({
          ...transaction.toData(),
          id: 1,
        });
      }),
      countByType: vi.fn(),
      sumQuantityByType: vi.fn(),
    };

    inventoryService = new InventoryService(
      mockPrisma,
      mockProductRepository,
      mockTransactionRepository
    );
  });

  describe('inbound - 入库业务逻辑', () => {
    it('应该成功执行入库操作', async () => {
      const mockProduct = createMockProduct(100);
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);

      const command: InboundCommand = {
        sku: 'SKU001',
        quantity: 10,
        supplierId: 1,
        operatorId: 1,
        remark: '测试入库',
      };

      const result = await inventoryService.inbound(command);

      expect(result.sku).toBe('SKU001');
      expect(result.quantity).toBe(10);
      expect(result.quantityBefore).toBe(100);
      expect(result.quantityAfter).toBe(110);
      expect(mockProductRepository.findBySku).toHaveBeenCalledWith('SKU001');
    });

    it('商品不存在时应该抛出错误', async () => {
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(null);

      const command: InboundCommand = {
        sku: 'INVALID_SKU',
        quantity: 10,
        supplierId: 1,
        operatorId: 1,
      };

      await expect(inventoryService.inbound(command)).rejects.toThrow('商品不存在');
    });

    it('入库数量为零时应该抛出错误', async () => {
      const command: InboundCommand = {
        sku: 'SKU001',
        quantity: 0,
        supplierId: 1,
        operatorId: 1,
      };

      await expect(inventoryService.inbound(command)).rejects.toThrow('入库数量必须为正整数');
    });

    it('入库数量为负数时应该抛出错误', async () => {
      const command: InboundCommand = {
        sku: 'SKU001',
        quantity: -5,
        supplierId: 1,
        operatorId: 1,
      };

      await expect(inventoryService.inbound(command)).rejects.toThrow('入库数量必须为正整数');
    });

    it('入库数量为小数时应该抛出错误', async () => {
      const command: InboundCommand = {
        sku: 'SKU001',
        quantity: 10.5,
        supplierId: 1,
        operatorId: 1,
      };

      await expect(inventoryService.inbound(command)).rejects.toThrow('入库数量必须为整数');
    });
  });

  describe('outbound - 出库业务逻辑', () => {
    it('应该成功执行出库操作', async () => {
      const mockProduct = createMockProduct(100);
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);

      const command: OutboundCommand = {
        sku: 'SKU001',
        quantity: 10,
        operatorId: 1,
        remark: '测试出库',
      };

      const result = await inventoryService.outbound(command);

      expect(result.sku).toBe('SKU001');
      expect(result.quantity).toBe(10);
      expect(result.quantityBefore).toBe(100);
      expect(result.quantityAfter).toBe(90);
    });

    it('商品不存在时应该抛出错误', async () => {
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(null);

      const command: OutboundCommand = {
        sku: 'INVALID_SKU',
        quantity: 10,
        operatorId: 1,
      };

      await expect(inventoryService.outbound(command)).rejects.toThrow('商品不存在');
    });

    it('库存不足时应该抛出错误', async () => {
      const mockProduct = createMockProduct(5); // 只有5个库存
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);

      const command: OutboundCommand = {
        sku: 'SKU001',
        quantity: 10, // 请求出库10个
        operatorId: 1,
      };

      await expect(inventoryService.outbound(command)).rejects.toThrow('库存不足');
    });

    it('出库数量等于库存时应该成功', async () => {
      const mockProduct = createMockProduct(10);
      vi.mocked(mockProductRepository.findBySku).mockResolvedValue(mockProduct);

      const command: OutboundCommand = {
        sku: 'SKU001',
        quantity: 10,
        operatorId: 1,
      };

      const result = await inventoryService.outbound(command);

      expect(result.quantityAfter).toBe(0);
    });

    it('出库数量为零时应该抛出错误', async () => {
      const command: OutboundCommand = {
        sku: 'SKU001',
        quantity: 0,
        operatorId: 1,
      };

      await expect(inventoryService.outbound(command)).rejects.toThrow('出库数量必须为正整数');
    });

    it('出库数量为负数时应该抛出错误', async () => {
      const command: OutboundCommand = {
        sku: 'SKU001',
        quantity: -5,
        operatorId: 1,
      };

      await expect(inventoryService.outbound(command)).rejects.toThrow('出库数量必须为正整数');
    });
  });

  describe('batchInbound - 批量入库业务逻辑', () => {
    it('应该成功执行批量入库操作', async () => {
      const mockProduct1 = createMockProduct(100);
      const mockProduct2 = Product.reconstruct({
        id: 2,
        sku: 'SKU002',
        name: '测试商品2',
        categoryId: 1,
        unit: '个',
        quantity: 50,
        minThreshold: 10,
        costPrice: 15,
        salePrice: 25,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      vi.mocked(mockProductRepository.findBySku)
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const command: BatchInboundCommand = {
        items: [
          { sku: 'SKU001', quantity: 10, supplierId: 1, operatorId: 1 },
          { sku: 'SKU002', quantity: 20, supplierId: 1, operatorId: 1 },
        ],
        operatorId: 1,
      };

      const result = await inventoryService.batchInbound(command);

      expect(result.success).toBe(true);
      expect(result.totalItems).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    it('入库列表为空时应该抛出错误', async () => {
      const command: BatchInboundCommand = {
        items: [],
        operatorId: 1,
      };

      await expect(inventoryService.batchInbound(command)).rejects.toThrow('入库列表不能为空');
    });

    it('某一行商品不存在时应该抛出错误并回滚', async () => {
      const mockProduct = createMockProduct(100);
      vi.mocked(mockProductRepository.findBySku)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null); // 第二个商品不存在

      const command: BatchInboundCommand = {
        items: [
          { sku: 'SKU001', quantity: 10, supplierId: 1, operatorId: 1 },
          { sku: 'INVALID_SKU', quantity: 20, supplierId: 1, operatorId: 1 },
        ],
        operatorId: 1,
      };

      await expect(inventoryService.batchInbound(command)).rejects.toThrow('第 2 行：商品 INVALID_SKU 不存在');
    });

    it('某一行入库数量无效时应该抛出错误', async () => {
      const command: BatchInboundCommand = {
        items: [
          { sku: 'SKU001', quantity: 10, supplierId: 1, operatorId: 1 },
          { sku: 'SKU002', quantity: 0, supplierId: 1, operatorId: 1 },
        ],
        operatorId: 1,
      };

      await expect(inventoryService.batchInbound(command)).rejects.toThrow('第 2 行：入库数量必须为正整数');
    });
  });

  describe('getInboundRecords - 入库记录查询', () => {
    it('应该返回入库记录列表', async () => {
      const mockTransaction = InventoryTransaction.reconstruct({
        id: 1,
        type: 'IN',
        productId: 1,
        sku: 'SKU001',
        quantity: 10,
        quantityBefore: 100,
        quantityAfter: 110,
        supplierId: 1,
        operatorId: 1,
        remark: null,
        createdAt: new Date(),
      });

      const mockResult: PaginationResult<TransactionListItem> = {
        list: [
          {
            transaction: mockTransaction,
            productName: '测试商品',
            supplierName: '测试供应商',
            operatorName: 'admin',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.mocked(mockTransactionRepository.findByType).mockResolvedValue(mockResult);

      const result = await inventoryService.getInboundRecords({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(1);
      expect(result.list[0].type).toBe('IN');
      expect(mockTransactionRepository.findByType).toHaveBeenCalledWith('IN', { page: 1, pageSize: 10 });
    });
  });

  describe('getOutboundRecords - 出库记录查询', () => {
    it('应该返回出库记录列表', async () => {
      const mockTransaction = InventoryTransaction.reconstruct({
        id: 1,
        type: 'OUT',
        productId: 1,
        sku: 'SKU001',
        quantity: 5,
        quantityBefore: 100,
        quantityAfter: 95,
        supplierId: null,
        operatorId: 1,
        remark: null,
        createdAt: new Date(),
      });

      const mockResult: PaginationResult<TransactionListItem> = {
        list: [
          {
            transaction: mockTransaction,
            productName: '测试商品',
            operatorName: 'admin',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.mocked(mockTransactionRepository.findByType).mockResolvedValue(mockResult);

      const result = await inventoryService.getOutboundRecords({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(1);
      expect(result.list[0].type).toBe('OUT');
      expect(mockTransactionRepository.findByType).toHaveBeenCalledWith('OUT', { page: 1, pageSize: 10 });
    });
  });
});

// ============================================
// 并发乐观锁测试
// ============================================

describe('Optimistic Lock Tests', () => {
  it('并发冲突时应该抛出错误', async () => {
    // 模拟并发冲突：updateMany 返回 count: 0
    const mockPrisma = {
      $transaction: vi.fn(async (callback) => {
        const mockTx = {
          product: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // 模拟并发冲突
          },
        };
        return callback(mockTx);
      }),
    } as unknown as PrismaClient;

    const mockProduct = Product.reconstruct({
      id: 1,
      sku: 'SKU001',
      name: '测试商品',
      categoryId: 1,
      unit: '个',
      quantity: 100,
      minThreshold: 10,
      costPrice: 10,
      salePrice: 20,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const mockProductRepository: IProductRepository = {
      findById: vi.fn(),
      findBySku: vi.fn().mockResolvedValue(mockProduct),
      findAll: vi.fn(),
      findLowStock: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      existsBySku: vi.fn(),
      count: vi.fn(),
      countLowStock: vi.fn(),
    };

    const mockTransactionRepository: ITransactionRepository = {
      findById: vi.fn(),
      findByType: vi.fn(),
      findByProductId: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      countByType: vi.fn(),
      sumQuantityByType: vi.fn(),
    };

    const inventoryService = new InventoryService(
      mockPrisma,
      mockProductRepository,
      mockTransactionRepository
    );

    const command: InboundCommand = {
      sku: 'SKU001',
      quantity: 10,
      supplierId: 1,
      operatorId: 1,
    };

    await expect(inventoryService.inbound(command)).rejects.toThrow('并发冲突，请重试');
  });
});
