/**
 * 自定义 Hooks
 */
import { useState, useCallback, useEffect } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { apiService, PaginatedResponse } from '@/services/api';

// 导出 useAuth hook
export { useAuth } from './useAuth';

// 导出 useDashboard hook
export { useDashboard } from './useDashboard';

// 导出 useProducts hook
export { useProducts, useCategories, useProduct } from './useProducts';

// 导出 useSuppliers hook
export { useSuppliers, useSupplier, useAllSuppliers } from './useSuppliers';

// 导出 useInventory hook
export { useInboundRecords, useOutboundRecords } from './useInventory';

// 通用 fetcher
const fetcher = async <T>(url: string): Promise<T> => {
  const response = await apiService.get<T>(url);
  return response.data;
};

/**
 * 使用 SWR 获取数据的 Hook
 */
export function useApi<T>(
  url: string | null,
  config?: SWRConfiguration
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    ...config,
  });
}

/**
 * 分页数据 Hook
 */
export function usePagination<T>(
  baseUrl: string,
  initialPage: number = 1,
  initialPageSize: number = 10
) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const url = `${baseUrl}?page=${page}&pageSize=${pageSize}`;
  
  const { data, error, isLoading, mutate } = useApi<PaginatedResponse<T>>(url);
  
  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);
  
  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
  }, []);
  
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;
  
  return {
    data: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    goToPage,
    changePageSize,
    refresh: mutate,
  };
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });
  
  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );
  
  return [storedValue, setValue];
}

/**
 * 模态框状态 Hook
 */
export function useModal(initialState: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * 表单提交状态 Hook
 */
export function useSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const submit = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setIsSubmitting(true);
      setError(null);
      
      try {
        const result = await fn();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : '操作失败';
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );
  
  const clearError = useCallback(() => setError(null), []);
  
  return {
    isSubmitting,
    error,
    submit,
    clearError,
  };
}
