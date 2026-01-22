/**
 * Dashboard API Service
 * 仪表盘数据服务
 */
import { apiService, ApiResponse } from './api';

// 仪表盘统计数据类型
export interface DashboardStats {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  todayInbound: number;
  todayOutbound: number;
}

// 仪表盘服务
export const dashboardService = {
  /**
   * 获取仪表盘统计数据
   */
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiService.get<DashboardStats>('/dashboard/stats');
  },
};

export default dashboardService;
