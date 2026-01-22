/**
 * Dashboard Data Hook
 * 使用 SWR 获取仪表盘数据
 */
import { useEffect, useState } from 'react';
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
  // 检查客户端是否有 token
  const [hasToken, setHasToken] = useState(false);
  
  useEffect(() => {
    // 只在客户端检查 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      setHasToken(!!token);
    }
  }, []);
  
  // 只有在有 token 时才发起请求
  const { data, error, isLoading, isValidating, mutate } = useSWR<DashboardStats>(
    hasToken ? '/dashboard/stats' : null,
    fetcher,
    {
      refreshInterval: 60000, // 每分钟自动刷新
      revalidateOnFocus: false, // 禁用窗口聚焦时重新验证，避免频繁请求
      revalidateOnReconnect: true, // 网络重连时重新验证
      dedupingInterval: 10000, // 10秒内重复请求去重
      shouldRetryOnError: false, // 错误时不自动重试
      errorRetryCount: 0, // 不重试
    }
  );

  return {
    stats: data,
    isLoading: hasToken ? isLoading : false,
    isRefreshing: isValidating && !isLoading,
    error: error ? (error instanceof Error ? error.message : '获取数据失败') : null,
    refresh: () => mutate(),
  };
}

export default useDashboard;
