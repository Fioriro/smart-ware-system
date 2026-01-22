/**
 * 认证 Hook
 * 提供登录、登出、获取用户信息等认证相关功能
 */
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/stores';
import { authService, LoginRequest } from '@/services/auth.service';

// 认证 Hook 返回类型
interface UseAuthReturn {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // 方法
  login: (credentials: LoginRequest, redirectTo?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<User | null>;
  clearError: () => void;
}

/**
 * 认证 Hook
 * 封装认证相关的状态和方法
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 用户登录
   * @param credentials 登录凭据
   * @param redirectTo 登录成功后跳转的路径
   * @returns 是否登录成功
   */
  const login = useCallback(
    async (credentials: LoginRequest, redirectTo: string = '/dashboard'): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authService.login(credentials);
        
        if (response.code === 200 && response.data) {
          const { token, user } = response.data;
          
          // 存储认证信息到 Zustand store
          setAuth(token, user);
          
          // 同时设置 cookie（用于 middleware 路由守卫）
          if (typeof document !== 'undefined') {
            document.cookie = `token=${token}; path=/; max-age=${24 * 60 * 60}`; // 24小时
          }
          
          // 跳转到目标页面
          router.push(redirectTo);
          
          return true;
        } else {
          setError(response.message || '登录失败');
          return false;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
        setError(message);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [router, setAuth]
  );

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      // 调用登出 API
      await authService.logout();
    } catch {
      // 即使 API 调用失败，也清除本地认证状态
      console.warn('登出 API 调用失败，但仍清除本地状态');
    } finally {
      // 清除 Zustand store 中的认证信息
      clearAuth();
      
      // 清除 cookie
      if (typeof document !== 'undefined') {
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      
      // 清除 localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
      }
      
      setIsLoading(false);
      
      // 跳转到登录页
      router.push('/login');
    }
  }, [clearAuth, router]);

  /**
   * 获取当前用户信息
   * @returns 用户信息或 null
   */
  const fetchCurrentUser = useCallback(async (): Promise<User | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.getCurrentUser();
      
      if (response.code === 200 && response.data) {
        return response.data;
      }
      
      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取用户信息失败';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 清除错误信息
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    fetchCurrentUser,
    clearError,
  };
}

export default useAuth;
