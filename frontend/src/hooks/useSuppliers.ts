/**
 * 供应商数据 Hook
 */
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { supplierService, Supplier, SupplierQueryParams } from '@/services/supplier.service';
import { PaginatedResponse } from '@/services/api';
import { useDebounce } from './index';

// 供应商列表 Hook
export function useSuppliers(initialParams: SupplierQueryParams = {}) {
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);
  const [keyword, setKeyword] = useState(initialParams.keyword || '');
  
  // 防抖搜索关键词
  const debouncedKeyword = useDebounce(keyword, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: SupplierQueryParams = {
      page,
      pageSize,
    };
    
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    
    return params;
  }, [page, pageSize, debouncedKeyword]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.keyword) searchParams.set('keyword', queryParams.keyword);
    return `/suppliers?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取供应商列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Supplier>>(
    swrKey,
    async () => {
      const response = await supplierService.getSuppliers(queryParams);
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
  
  // 搜索
  const search = useCallback((newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setKeyword('');
    setPage(1);
  }, []);
  
  return {
    // 数据
    suppliers: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    keyword,
    
    // 状态
    isLoading,
    error: error?.message || null,
    
    // 方法
    goToPage,
    changePageSize,
    search,
    refresh,
    resetFilters,
  };
}

// 单个供应商 Hook
export function useSupplier(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Supplier | null>(
    id ? `/suppliers/${id}` : null,
    async () => {
      if (!id) return null;
      const response = await supplierService.getSupplier(id);
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  return {
    supplier: data || null,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

// 所有供应商 Hook（用于下拉选择）
export function useAllSuppliers() {
  const { data, error, isLoading, mutate } = useSWR<Supplier[]>(
    '/suppliers/all',
    async () => {
      const response = await supplierService.getAllSuppliers();
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  return {
    suppliers: data || [],
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export default useSuppliers;
