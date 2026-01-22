/**
 * 仪表盘服务
 * 处理仪表盘相关的业务逻辑
 * 
 * 提供以下统计数据：
 * - 商品总数（不含软删除）
 * - 库存总量
 * - 低库存预警数量
 * - 今日入库总量
 * - 今日出库总量
 */

import { PrismaClient } from '@prisma/client';
import { DashboardStats, DashboardStatsDTO, toDashboardStatsDTO } from './dashboard.model';

/**
 * 仪表盘服务类
 */
export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取今日开始时间（当天 00:00:00）
   * @returns 今日开始时间
   */
  private getTodayStart(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  /**
   * 获取今日结束时间（当天 23:59:59.999）
   * @returns 今日结束时间
   */
  private getTodayEnd(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  /**
   * 获取商品总数（不含软删除）
   * @returns 商品总数
   */
  async getTotalProducts(): Promise<number> {
    return this.prisma.product.count({
      where: {
        deletedAt: null,
      },
    });
  }

  /**
   * 获取库存总量
   * @returns 库存总量
   */
  async getTotalQuantity(): Promise<number> {
    const result = await this.prisma.product.aggregate({
      where: {
        deletedAt: null,
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  /**
   * 获取低库存预警数量
   * 低库存定义：库存数量 <= 预警阈值
   * @returns 低库存商品数量
   */
  async getLowStockCount(): Promise<number> {
    // 使用原始 SQL 查询，因为 Prisma 不支持直接比较两个字段
    const result = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE deleted_at IS NULL 
        AND quantity <= min_threshold
    `;
    return Number(result[0].count);
  }

  /**
   * 获取今日入库总量
   * @returns 今日入库总量
   */
  async getTodayInbound(): Promise<number> {
    const todayStart = this.getTodayStart();
    const todayEnd = this.getTodayEnd();

    const result = await this.prisma.inventoryTransaction.aggregate({
      where: {
        type: 'IN',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  /**
   * 获取今日出库总量
   * @returns 今日出库总量
   */
  async getTodayOutbound(): Promise<number> {
    const todayStart = this.getTodayStart();
    const todayEnd = this.getTodayEnd();

    const result = await this.prisma.inventoryTransaction.aggregate({
      where: {
        type: 'OUT',
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  /**
   * 获取仪表盘统计数据
   * 并行查询所有统计数据以提高性能
   * @returns 仪表盘统计数据 DTO
   */
  async getStats(): Promise<DashboardStatsDTO> {
    // 并行执行所有查询以提高性能
    const [
      totalProducts,
      totalQuantity,
      lowStockCount,
      todayInbound,
      todayOutbound,
    ] = await Promise.all([
      this.getTotalProducts(),
      this.getTotalQuantity(),
      this.getLowStockCount(),
      this.getTodayInbound(),
      this.getTodayOutbound(),
    ]);

    const stats: DashboardStats = {
      totalProducts,
      totalQuantity,
      lowStockCount,
      todayInbound,
      todayOutbound,
    };

    return toDashboardStatsDTO(stats);
  }
}

export default DashboardService;
