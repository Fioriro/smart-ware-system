/**
 * 仪表盘模块单元测试
 * 测试仪表盘服务的功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DashboardService } from './dashboard.service';
import { toDashboardStatsDTO, DashboardStats } from './dashboard.model';

// Mock Prisma Client
const mockPrismaProduct = {
  count: vi.fn(),
  aggregate: vi.fn(),
};

const mockPrismaInventoryTransaction = {
  aggregate: vi.fn(),
};

const mockPrisma = {
  product: mockPrismaProduct,
  inventoryTransaction: mockPrismaInventoryTransaction,
  $queryRaw: vi.fn(),
} as unknown as import('@prisma/client').PrismaClient;

describe('DashboardService', () => {
  let dashboardService: DashboardService;

  beforeEach(() => {
    dashboardService = new DashboardService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTotalProducts', () => {
    it('应该返回商品总数（不含软删除）', async () => {
      mockPrismaProduct.count.mockResolvedValue(100);

      const result = await dashboardService.getTotalProducts();

      expect(result).toBe(100);
      expect(mockPrismaProduct.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
        },
      });
    });

    it('应该在没有商品时返回 0', async () => {
      mockPrismaProduct.count.mockResolvedValue(0);

      const result = await dashboardService.getTotalProducts();

      expect(result).toBe(0);
    });
  });

  describe('getTotalQuantity', () => {
    it('应该返回库存总量', async () => {
      mockPrismaProduct.aggregate.mockResolvedValue({
        _sum: { quantity: 5000 },
      });

      const result = await dashboardService.getTotalQuantity();

      expect(result).toBe(5000);
      expect(mockPrismaProduct.aggregate).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
        },
        _sum: {
          quantity: true,
        },
      });
    });

    it('应该在没有库存时返回 0', async () => {
      mockPrismaProduct.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await dashboardService.getTotalQuantity();

      expect(result).toBe(0);
    });
  });

  describe('getLowStockCount', () => {
    it('应该返回低库存商品数量', async () => {
      mockPrisma.$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(5) }]);

      const result = await dashboardService.getLowStockCount();

      expect(result).toBe(5);
    });

    it('应该在没有低库存商品时返回 0', async () => {
      mockPrisma.$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(0) }]);

      const result = await dashboardService.getLowStockCount();

      expect(result).toBe(0);
    });
  });

  describe('getTodayInbound', () => {
    it('应该返回今日入库总量', async () => {
      mockPrismaInventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 200 },
      });

      const result = await dashboardService.getTodayInbound();

      expect(result).toBe(200);
      expect(mockPrismaInventoryTransaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'IN',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
          _sum: {
            quantity: true,
          },
        })
      );
    });

    it('应该在今日没有入库时返回 0', async () => {
      mockPrismaInventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await dashboardService.getTodayInbound();

      expect(result).toBe(0);
    });
  });

  describe('getTodayOutbound', () => {
    it('应该返回今日出库总量', async () => {
      mockPrismaInventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: 150 },
      });

      const result = await dashboardService.getTodayOutbound();

      expect(result).toBe(150);
      expect(mockPrismaInventoryTransaction.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'OUT',
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
          _sum: {
            quantity: true,
          },
        })
      );
    });

    it('应该在今日没有出库时返回 0', async () => {
      mockPrismaInventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await dashboardService.getTodayOutbound();

      expect(result).toBe(0);
    });
  });

  describe('getStats', () => {
    it('应该返回完整的仪表盘统计数据', async () => {
      mockPrismaProduct.count.mockResolvedValue(100);
      mockPrismaProduct.aggregate.mockResolvedValue({
        _sum: { quantity: 5000 },
      });
      mockPrisma.$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(5) }]);
      
      // 设置入库和出库的 mock
      mockPrismaInventoryTransaction.aggregate
        .mockResolvedValueOnce({ _sum: { quantity: 200 } })  // 入库
        .mockResolvedValueOnce({ _sum: { quantity: 150 } }); // 出库

      const result = await dashboardService.getStats();

      expect(result).toEqual({
        totalProducts: 100,
        totalQuantity: 5000,
        lowStockCount: 5,
        todayInbound: 200,
        todayOutbound: 150,
      });
    });

    it('应该在数据库为空时返回全零统计', async () => {
      mockPrismaProduct.count.mockResolvedValue(0);
      mockPrismaProduct.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });
      mockPrisma.$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(0) }]);
      mockPrismaInventoryTransaction.aggregate.mockResolvedValue({
        _sum: { quantity: null },
      });

      const result = await dashboardService.getStats();

      expect(result).toEqual({
        totalProducts: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        todayInbound: 0,
        todayOutbound: 0,
      });
    });

    it('应该并行执行所有查询', async () => {
      // 设置延迟的 mock 来验证并行执行
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      mockPrismaProduct.count.mockImplementation(async () => {
        await delay(10);
        return 100;
      });
      mockPrismaProduct.aggregate.mockImplementation(async () => {
        await delay(10);
        return { _sum: { quantity: 5000 } };
      });
      mockPrisma.$queryRaw = vi.fn().mockImplementation(async () => {
        await delay(10);
        return [{ count: BigInt(5) }];
      });
      mockPrismaInventoryTransaction.aggregate.mockImplementation(async () => {
        await delay(10);
        return { _sum: { quantity: 100 } };
      });

      const startTime = Date.now();
      await dashboardService.getStats();
      const endTime = Date.now();

      // 如果是串行执行，至少需要 50ms（5个查询 * 10ms）
      // 如果是并行执行，应该在 20ms 左右完成
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});

describe('dashboard.model', () => {
  describe('toDashboardStatsDTO', () => {
    it('应该正确转换仪表盘统计数据为 DTO', () => {
      const stats: DashboardStats = {
        totalProducts: 100,
        totalQuantity: 5000,
        lowStockCount: 5,
        todayInbound: 200,
        todayOutbound: 150,
      };

      const dto = toDashboardStatsDTO(stats);

      expect(dto).toEqual({
        totalProducts: 100,
        totalQuantity: 5000,
        lowStockCount: 5,
        todayInbound: 200,
        todayOutbound: 150,
      });
    });

    it('应该正确处理零值', () => {
      const stats: DashboardStats = {
        totalProducts: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        todayInbound: 0,
        todayOutbound: 0,
      };

      const dto = toDashboardStatsDTO(stats);

      expect(dto).toEqual({
        totalProducts: 0,
        totalQuantity: 0,
        lowStockCount: 0,
        todayInbound: 0,
        todayOutbound: 0,
      });
    });
  });
});
