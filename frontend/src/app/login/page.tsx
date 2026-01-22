'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// 登录表单验证 Schema
const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

// 登录表单类型
type LoginFormData = z.infer<typeof loginSchema>;

/**
 * 登录表单内部组件（处理 searchParams）
 */
function LoginFormInner({ 
  onError, 
  onLoading 
}: { 
  onError: (error: string | null) => void;
  onLoading: (loading: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const { setAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 使用 React Hook Form + Zod 验证
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // 页面加载时聚焦用户名输入框
  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  // 表单提交处理
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    onLoading(true);
    onError(null);

    try {
      const response = await authService.login(data);
      
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
      } else {
        onError(response.message || '登录失败');
        setValue('password', '');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请稍后重试';
      onError(message);
      setValue('password', '');
    } finally {
      setIsSubmitting(false);
      onLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="text-left">
        <Input
          {...register('username')}
          label="用户名"
          placeholder="请输入用户名"
          error={errors.username?.message}
          disabled={isSubmitting}
          data-testid="username-input"
          autoComplete="username"
          size="lg"
          className="rounded-xl"
        />
      </div>

      <div className="text-left">
        <Input
          {...register('password')}
          type="password"
          label="密码"
          placeholder="请输入密码"
          error={errors.password?.message}
          disabled={isSubmitting}
          data-testid="password-input"
          autoComplete="current-password"
          size="lg"
          className="rounded-xl"
        />
      </div>

      <div className="flex justify-end">
        <a 
          href="/reset-password" 
          className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
          data-testid="forgot-password-link"
        >
          忘记密码？
        </a>
      </div>

      <Button
        type="submit"
        loading={isSubmitting}
        fullWidth
        size="lg"
        className="bg-slate-900 hover:bg-slate-800 rounded-xl font-semibold transition-all transform hover:scale-[1.02]"
        style={{ boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}
        data-testid="login-button"
      >
        {isSubmitting ? '登录中...' : '登录系统'}
      </Button>
    </form>
  );
}

/**
 * 登录表单加载状态
 */
function LoginFormSkeleton() {
  return (
    <div className="space-y-5">
      <div className="text-left">
        <div className="h-4 w-16 bg-slate-200 rounded mb-2 skeleton" />
        <div className="h-12 bg-slate-100 rounded-xl skeleton" />
      </div>
      <div className="text-left">
        <div className="h-4 w-12 bg-slate-200 rounded mb-2 skeleton" />
        <div className="h-12 bg-slate-100 rounded-xl skeleton" />
      </div>
      <div className="flex justify-end">
        <div className="h-4 w-20 bg-slate-200 rounded skeleton" />
      </div>
      <div className="h-12 bg-slate-200 rounded-xl skeleton" />
    </div>
  );
}

/**
 * 登录页面
 * 实现用户登录功能
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorRef = useRef<string | null>(null);

  // 设置错误的包装函数
  const handleSetError = useCallback((err: string | null) => {
    errorRef.current = err;
    setError(err);
  }, []);

  // 清除错误信息（5秒后自动清除）
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        errorRef.current = null;
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 显示的错误信息
  const displayError = error || errorRef.current;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      {/* 登录卡片 */}
      <div 
        className="bg-white/70 backdrop-blur-xl border border-white/30 shadow-[0_4px_20px_-5px_rgba(148,163,184,0.15)] p-10 rounded-2xl w-full max-w-md text-center relative z-10"
        data-testid="login-card"
      >
        {/* Logo */}
        <div className="mb-8">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4"
            style={{ boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.2)' }}
          >
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-700">SmartStock</h1>
          <p className="text-slate-500 mt-2">智能库存管理助手</p>
        </div>

        {/* 登录表单 - 使用 Suspense 包裹 */}
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginFormInner onError={handleSetError} onLoading={setIsLoading} />
        </Suspense>

        {/* 错误提示 - 放在 Suspense 外部 */}
        {displayError && (
          <div 
            className="mt-4 p-4 bg-rose-50 rounded-xl border border-rose-100"
            data-testid="error-message"
          >
            <p className="text-sm text-rose-600 font-medium">{displayError}</p>
          </div>
        )}

        {/* 版权 */}
        <p className="text-slate-400 text-xs mt-8">
          © {new Date().getFullYear()} SmartStock. All rights reserved.
        </p>
      </div>
    </div>
  );
}
