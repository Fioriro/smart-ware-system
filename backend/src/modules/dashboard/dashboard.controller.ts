/**
 * 仪表盘控制器
 * 处理仪表盘相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { ResponseUtil } from '../../shared/utils/response';

/**
 * 仪表盘控制器类
 */
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  /**
   * 获取仪表盘统计数据
   * GET /api/v1/dashboard/stats
   * 
   * 返回数据：
   * - totalProducts: 商品总数
   * - totalQuantity: 库存总量
   * - lowStockCount: 低库存预警数量
   * - todayInbound: 今日入库总量
   * - todayOutbound: 今日出库总量
   */
  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.dashboardService.getStats();
      ResponseUtil.success(res, stats, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取仪表盘统计数据失败';
      ResponseUtil.error(res, message);
    }
  };
}

export default DashboardController;
