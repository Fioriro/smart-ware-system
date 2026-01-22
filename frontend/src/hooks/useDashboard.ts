/**
 * Dashboard Data Hook
 * 使用 SWR 获取仪表盘数据
 */
import useSWR from 'swr';
import { apiService } from '@/services/api';
import { DashboardStats } from '@/services/dashboard.service';

// SWR fetcher
const fetcher = async (url: string): Promise<DashboardStats> => {
  const response = await apiService.get<DashboardStats>(url);
  return response.data;
};

/**
 * 仪表盘数据 Hook
 * @returns 仪表盘统计数据、加载状态、错误信息、刷新方法
 */
export function useDashboard() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardStats>(
    '/dashboard/stats',
    fetcher,
    {
      refreshInterval: 60000, // 每分钟自动刷新
      revalidateOnFocus: true, // 窗口聚焦时重新验证
      revalidateOnReconnect: true, // 网络重连时重新验证
      dedupingInterval: 5000, // 5秒内重复请求去重
    }
  );

  return {
    stats: data,
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error: error ? (error instanceof Error ? error.message : '获取数据失败') : null,
    refresh: () => mutate(),
  };
}

export default useDashboard;
