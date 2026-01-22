'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UserRole, UserStatus } from '@/services/user.service';

// 创建用户表单验证 Schema
const createUserSchema = z.object({
  username: z.string()
    .min(3, '用户名长度不能少于3个字符')
    .max(50, '用户名长度不能超过50个字符'),
  password: z.string()
    .min(6, '密码长度不能少于6位'),
  role: z.string().min(1, '请选择角色'),
  status: z.number(),
});

// 编辑用户表单验证 Schema
const editUserSchema = z.object({
  role: z.string().min(1, '请选择角色'),
  status: z.number(),
  password: z.string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: '密码长度不能少于6位',
    }),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type EditUserFormData = z.infer<typeof editUserSchema>;

// 表单 Props
interface UserFormProps {
  initialData?: {
    username?: string;
    role?: string;
    status?: number;
  };
  onSubmit: (data: CreateUserFormData | EditUserFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

// 用户表单组件
export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}) => {
  const schema = isEdit ? editUserSchema : createUserSchema;
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateUserFormData | EditUserFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          role: initialData?.role || UserRole.USER,
          status: initialData?.status ?? UserStatus.ENABLED,
          password: '',
        }
      : {
          username: '',
          password: '',
          role: UserRole.USER,
          status: UserStatus.ENABLED,
        },
  });
  
  // 当初始数据变化时重置表单
  useEffect(() => {
    if (initialData && isEdit) {
      reset({
        role: initialData.role || UserRole.USER,
        status: initialData.status ?? UserStatus.ENABLED,
        password: '',
      });
    }
  }, [initialData, isEdit, reset]);
  
  const role = watch('role');
  const status = watch('status');
  
  const handleFormSubmit = async (data: CreateUserFormData | EditUserFormData) => {
    // 如果是编辑模式且密码为空，则不提交密码字段
    if (isEdit && 'password' in data && !data.password) {
      const { password, ...rest } = data as EditUserFormData;
      await onSubmit(rest as EditUserFormData);
    } else {
      await onSubmit(data);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* 用户名（仅创建时显示） */}
      {!isEdit && (
        <Input
          label="用户名"
          placeholder="请输入用户名（3-50个字符）"
          {...register('username' as keyof CreateUserFormData)}
          error={(errors as { username?: { message?: string } }).username?.message}
          data-testid="input-username"
        />
      )}
      
      {/* 密码 */}
      <Input
        label={isEdit ? '新密码（留空则不修改）' : '密码'}
        type="password"
        placeholder={isEdit ? '留空则不修改密码' : '请输入密码（至少6位）'}
        {...register('password')}
        error={errors.password?.message}
        data-testid="input-password"
      />
      
      {/* 角色 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          角色
        </label>
        <select
          className={`
            w-full px-4 py-2 text-sm rounded-lg border
            bg-white text-slate-900
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${errors.role ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
          `}
          value={role || ''}
          onChange={(e) => setValue('role', e.target.value)}
          data-testid="select-role"
        >
          <option value={UserRole.ADMIN}>管理员</option>
          <option value={UserRole.USER}>普通用户</option>
        </select>
        {errors.role && (
          <p className="mt-1.5 text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>
      
      {/* 状态 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          状态
        </label>
        <select
          className={`
            w-full px-4 py-2 text-sm rounded-lg border
            bg-white text-slate-900
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
            ${errors.status ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
          `}
          value={status ?? UserStatus.ENABLED}
          onChange={(e) => setValue('status', Number(e.target.value))}
          data-testid="select-status"
        >
          <option value={UserStatus.ENABLED}>启用</option>
          <option value={UserStatus.DISABLED}>禁用</option>
        </select>
        {errors.status && (
          <p className="mt-1.5 text-sm text-red-500">{errors.status.message}</p>
        )}
      </div>
      
      {/* 操作按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          data-testid="submit-button"
        >
          {isEdit ? '保存修改' : '创建用户'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
