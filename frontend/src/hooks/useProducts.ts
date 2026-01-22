/**
 * 商品数据 Hook
 */
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { productService, Product, ProductQueryParams } from '@/services/product.service';
import { categoryService, CategoryTreeNode, flattenCategories } from '@/services/category.service';
import { PaginatedResponse } from '@/services/api';
import { useDebounce } from './index';

// 商品列表 Hook
export function useProducts(initialParams: ProductQueryParams = {}) {
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || 10);
  const [keyword, setKeyword] = useState(initialParams.keyword || '');
  const [categoryId, setCategoryId] = useState<number | undefined>(initialParams.categoryId);
  const [lowStock, setLowStock] = useState<boolean>(initialParams.lowStock || false);
  
  // 防抖搜索关键词
  const debouncedKeyword = useDebounce(keyword, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: ProductQueryParams = {
      page,
      pageSize,
    };
    
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (categoryId) params.categoryId = categoryId;
    if (lowStock) params.lowStock = lowStock;
    
    return params;
  }, [page, pageSize, debouncedKeyword, categoryId, lowStock]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.keyword) searchParams.set('keyword', queryParams.keyword);
    if (queryParams.categoryId) searchParams.set('categoryId', String(queryParams.categoryId));
    if (queryParams.lowStock) searchParams.set('lowStock', 'true');
    return `/products?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取商品列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Product>>(
    swrKey,
    async () => {
      const response = await productService.getProducts(queryParams);
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
  
  // 筛选分类
  const filterByCategory = useCallback((newCategoryId: number | undefined) => {
    setCategoryId(newCategoryId);
    setPage(1);
  }, []);
  
  // 筛选低库存
  const filterLowStock = useCallback((isLowStock: boolean) => {
    setLowStock(isLowStock);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setKeyword('');
    setCategoryId(undefined);
    setLowStock(false);
    setPage(1);
  }, []);
  
  return {
    // 数据
    products: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    keyword,
    categoryId,
    lowStock,
    
    // 状态
    isLoading,
    error: error?.message || null,
    
    // 方法
    goToPage,
    changePageSize,
    search,
    filterByCategory,
    filterLowStock,
    refresh,
    resetFilters,
  };
}

// 分类列表 Hook
export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<CategoryTreeNode[]>(
    '/categories',
    async () => {
      const response = await categoryService.getCategories();
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  // 扁平化分类列表（用于下拉选择）
  const flatCategories = useMemo(() => {
    if (!data) return [];
    return flattenCategories(data);
  }, [data]);
  
  return {
    categories: data || [],
    flatCategories,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

// 单个商品 Hook
export function useProduct(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<Product | null>(
    id ? `/products/${id}` : null,
    async () => {
      if (!id) return null;
      const response = await productService.getProduct(id);
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  return {
    product: data || null,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export default useProducts;
