/**
 * 库存数据 Hook
 */
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { inventoryService, InboundRecord, InboundRecordQueryParams, OutboundRecord, OutboundRecordQueryParams } from '@/services/inventory.service';
import { PaginatedResponse } from '@/services/api';
import { useDebounce } from './index';

// 入库记录列表 Hook
export function useInboundRecords(initialParams: InboundRecordQueryParams = {}) {
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);
  const [sku, setSku] = useState(initialParams.sku || '');
  const [supplierId, setSupplierId] = useState<number | undefined>(initialParams.supplierId);
  const [startDate, setStartDate] = useState(initialParams.startDate || '');
  const [endDate, setEndDate] = useState(initialParams.endDate || '');
  
  // 防抖搜索关键词
  const debouncedSku = useDebounce(sku, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: InboundRecordQueryParams = {
      page,
      pageSize,
    };
    
    if (debouncedSku) params.sku = debouncedSku;
    if (supplierId) params.supplierId = supplierId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return params;
  }, [page, pageSize, debouncedSku, supplierId, startDate, endDate]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.sku) searchParams.set('sku', queryParams.sku);
    if (queryParams.supplierId) searchParams.set('supplierId', String(queryParams.supplierId));
    if (queryParams.startDate) searchParams.set('startDate', queryParams.startDate);
    if (queryParams.endDate) searchParams.set('endDate', queryParams.endDate);
    return `/inventory/inbound/records?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取入库记录列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<InboundRecord>>(
    swrKey,
    async () => {
      const response = await inventoryService.getInboundRecords(queryParams);
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
  
  // 搜索 SKU
  const searchSku = useCallback((newSku: string) => {
    setSku(newSku);
    setPage(1);
  }, []);
  
  // 筛选供应商
  const filterBySupplier = useCallback((newSupplierId: number | undefined) => {
    setSupplierId(newSupplierId);
    setPage(1);
  }, []);
  
  // 设置日期范围
  const setDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setSku('');
    setSupplierId(undefined);
    setStartDate('');
    setEndDate('');
    setPage(1);
  }, []);
  
  return {
    // 数据
    records: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    sku,
    supplierId,
    startDate,
    endDate,
    
    // 状态
    isLoading,
    error: error?.message || null,
    
    // 方法
    goToPage,
    changePageSize,
    searchSku,
    filterBySupplier,
    setDateRange,
    refresh,
    resetFilters,
  };
}

// 出库记录列表 Hook
export function useOutboundRecords(initialParams: OutboundRecordQueryParams = {}) {
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);
  const [sku, setSku] = useState(initialParams.sku || '');
  const [startDate, setStartDate] = useState(initialParams.startDate || '');
  const [endDate, setEndDate] = useState(initialParams.endDate || '');
  
  // 防抖搜索关键词
  const debouncedSku = useDebounce(sku, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: OutboundRecordQueryParams = {
      page,
      pageSize,
    };
    
    if (debouncedSku) params.sku = debouncedSku;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    return params;
  }, [page, pageSize, debouncedSku, startDate, endDate]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.sku) searchParams.set('sku', queryParams.sku);
    if (queryParams.startDate) searchParams.set('startDate', queryParams.startDate);
    if (queryParams.endDate) searchParams.set('endDate', queryParams.endDate);
    return `/inventory/outbound/records?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取出库记录列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<OutboundRecord>>(
    swrKey,
    async () => {
      const response = await inventoryService.getOutboundRecords(queryParams);
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
  
  // 搜索 SKU
  const searchSku = useCallback((newSku: string) => {
    setSku(newSku);
    setPage(1);
  }, []);
  
  // 设置日期范围
  const setDateRange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setSku('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }, []);
  
  return {
    // 数据
    records: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    sku,
    startDate,
    endDate,
    
    // 状态
    isLoading,
    error: error?.message || null,
    
    // 方法
    goToPage,
    changePageSize,
    searchSku,
    setDateRange,
    refresh,
    resetFilters,
  };
}

export default useInboundRecords;
