/**
 * 审计日志数据 Hook
 * 提供审计日志列表查询和导出功能
 */
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { logService, AuditLog, AuditLogQueryParams, OperationType } from '@/services/log.service';
import { PaginatedResponse } from '@/services/api';
import { useDebounce } from './index';

// 默认每页显示条数（审计日志每页20条）
const DEFAULT_PAGE_SIZE = 20;

/**
 * 审计日志列表 Hook
 * @param initialParams 初始查询参数
 */
export function useLogs(initialParams: AuditLogQueryParams = {}) {
  // 分页状态
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || DEFAULT_PAGE_SIZE);
  
  // 筛选条件状态
  const [startDate, setStartDate] = useState(initialParams.startDate || '');
  const [endDate, setEndDate] = useState(initialParams.endDate || '');
  const [operationType, setOperationType] = useState<OperationType | ''>(initialParams.operationType || '');
  const [keyword, setKeyword] = useState(initialParams.keyword || '');
  
  // 导出状态
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  
  // 防抖搜索关键词
  const debouncedKeyword = useDebounce(keyword, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: AuditLogQueryParams = {
      page,
      pageSize,
    };
    
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (operationType) params.operationType = operationType;
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    
    return params;
  }, [page, pageSize, startDate, endDate, operationType, debouncedKeyword]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.startDate) searchParams.set('startDate', queryParams.startDate);
    if (queryParams.endDate) searchParams.set('endDate', queryParams.endDate);
    if (queryParams.operationType) searchParams.set('operationType', queryParams.operationType);
    if (queryParams.keyword) searchParams.set('keyword', queryParams.keyword);
    return `/logs?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取审计日志列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<AuditLog>>(
    swrKey,
    async () => {
      const response = await logService.getLogs(queryParams);
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  // 计算总页数
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  
  // 翻页
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  // 修改每页数量
  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);
  
  // 设置日期范围
  const setDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);
  
  // 设置操作类型筛选
  const filterByOperationType = useCallback((type: OperationType | '') => {
    setOperationType(type);
    setPage(1);
  }, []);
  
  // 搜索关键词（SKU或操作人）
  const searchKeyword = useCallback((newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置所有筛选条件
  const resetFilters = useCallback(() => {
    setStartDate('');
    setEndDate('');
    setOperationType('');
    setKeyword('');
    setPage(1);
  }, []);
  
  // 导出 Excel
  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      await logService.exportLogs({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        operationType: operationType || undefined,
        keyword: debouncedKeyword || undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '导出失败';
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, [startDate, endDate, operationType, debouncedKeyword]);
  
  // 清除导出错误
  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);
  
  return {
    // 数据
    logs: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    startDate,
    endDate,
    operationType,
    keyword,
    
    // 状态
    isLoading,
    error: error?.message || null,
    isExporting,
    exportError,
    
    // 方法
    goToPage,
    changePageSize,
    setDateRange,
    filterByOperationType,
    searchKeyword,
    refresh,
    resetFilters,
    exportToExcel,
    clearExportError,
  };
}

export default useLogs;
