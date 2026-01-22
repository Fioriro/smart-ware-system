/**
 * 仪表盘模型
 * 定义仪表盘相关的类型和接口
 */

/**
 * 仪表盘统计数据接口
 */
export interface DashboardStats {
  totalProducts: number;      // 商品总数（不含软删除）
  totalQuantity: number;      // 库存总量
  lowStockCount: number;      // 低库存预警数量
  todayInbound: number;       // 今日入库总量
  todayOutbound: number;      // 今日出库总量
}

/**
 * 仪表盘统计数据 DTO
 */
export interface DashboardStatsDTO {
  totalProducts: number;
  totalQuantity: number;
  lowStockCount: number;
  todayInbound: number;
  todayOutbound: number;
}

/**
 * 将仪表盘统计数据转换为 DTO
 * @param stats 仪表盘统计数据
 * @returns 仪表盘统计数据 DTO
 */
export const toDashboardStatsDTO = (stats: DashboardStats): DashboardStatsDTO => {
  return {
    totalProducts: stats.totalProducts,
    totalQuantity: stats.totalQuantity,
    lowStockCount: stats.lowStockCount,
    todayInbound: stats.todayInbound,
    todayOutbound: stats.todayOutbound,
  };
};

export default {
  toDashboardStatsDTO,
};
