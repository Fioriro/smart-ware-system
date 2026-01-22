/**
 * 用户管理数据 Hook
 * 提供用户列表查询和 CRUD 操作
 */
import { useState, useCallback, useMemo } from 'react';
import useSWR from 'swr';
import { userService, User, UserQueryParams, CreateUserParams, UpdateUserParams, UserStatus } from '@/services/user.service';
import { PaginatedResponse } from '@/services/api';
import { useDebounce } from './index';

// 默认每页显示条数
const DEFAULT_PAGE_SIZE = 10;

/**
 * 用户列表 Hook
 * @param initialParams 初始查询参数
 */
export function useUsers(initialParams: UserQueryParams = {}) {
  // 分页状态
  const [page, setPage] = useState(initialParams.page || 1);
  const [pageSize, setPageSize] = useState(initialParams.pageSize || DEFAULT_PAGE_SIZE);
  
  // 筛选条件状态
  const [keyword, setKeyword] = useState(initialParams.keyword || '');
  const [status, setStatus] = useState<number | undefined>(initialParams.status);
  
  // 操作状态
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  
  // 防抖搜索关键词
  const debouncedKeyword = useDebounce(keyword, 300);
  
  // 构建查询参数
  const queryParams = useMemo(() => {
    const params: UserQueryParams = {
      page,
      pageSize,
    };
    
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (status !== undefined) params.status = status;
    
    return params;
  }, [page, pageSize, debouncedKeyword, status]);
  
  // 构建 SWR key
  const swrKey = useMemo(() => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(queryParams.page));
    searchParams.set('pageSize', String(queryParams.pageSize));
    if (queryParams.keyword) searchParams.set('keyword', queryParams.keyword);
    if (queryParams.status !== undefined) searchParams.set('status', String(queryParams.status));
    return `/users?${searchParams.toString()}`;
  }, [queryParams]);
  
  // 获取用户列表
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<User>>(
    swrKey,
    async () => {
      const response = await userService.getUsers(queryParams);
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
  
  // 搜索关键词
  const searchKeyword = useCallback((newKeyword: string) => {
    setKeyword(newKeyword);
    setPage(1);
  }, []);
  
  // 筛选状态
  const filterByStatus = useCallback((newStatus: number | undefined) => {
    setStatus(newStatus);
    setPage(1);
  }, []);
  
  // 刷新数据
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);
  
  // 重置筛选条件
  const resetFilters = useCallback(() => {
    setKeyword('');
    setStatus(undefined);
    setPage(1);
  }, []);
  
  // 清除操作错误
  const clearOperationError = useCallback(() => {
    setOperationError(null);
  }, []);
  
  // 创建用户
  const createUser = useCallback(async (data: CreateUserParams): Promise<boolean> => {
    setIsCreating(true);
    setOperationError(null);
    
    try {
      await userService.createUser(data);
      await mutate();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建用户失败';
      setOperationError(message);
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [mutate]);
  
  // 更新用户
  const updateUser = useCallback(async (id: number, data: UpdateUserParams): Promise<boolean> => {
    setIsUpdating(true);
    setOperationError(null);
    
    try {
      await userService.updateUser(id, data);
      await mutate();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新用户失败';
      setOperationError(message);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [mutate]);
  
  // 删除用户
  const deleteUser = useCallback(async (id: number): Promise<boolean> => {
    setIsDeleting(true);
    setOperationError(null);
    
    try {
      await userService.deleteUser(id);
      await mutate();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除用户失败';
      setOperationError(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [mutate]);
  
  // 切换用户状态
  const toggleStatus = useCallback(async (id: number, currentStatus: number): Promise<boolean> => {
    const newStatus = currentStatus === UserStatus.ENABLED ? UserStatus.DISABLED : UserStatus.ENABLED;
    return updateUser(id, { status: newStatus });
  }, [updateUser]);
  
  return {
    // 数据
    users: data?.list || [],
    total: data?.total || 0,
    page,
    pageSize,
    totalPages,
    
    // 筛选条件
    keyword,
    status,
    
    // 加载状态
    isLoading,
    error: error?.message || null,
    
    // 操作状态
    isCreating,
    isUpdating,
    isDeleting,
    operationError,
    
    // 方法
    goToPage,
    changePageSize,
    searchKeyword,
    filterByStatus,
    refresh,
    resetFilters,
    clearOperationError,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
  };
}

/**
 * 单个用户 Hook
 * @param id 用户ID
 */
export function useUser(id: number | null) {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    id ? `/users/${id}` : null,
    async () => {
      if (!id) return null;
      const response = await userService.getUser(id);
      return response.data;
    },
    {
      revalidateOnFocus: false,
    }
  );
  
  return {
    user: data || null,
    isLoading,
    error: error?.message || null,
    refresh: mutate,
  };
}

export default useUsers;
