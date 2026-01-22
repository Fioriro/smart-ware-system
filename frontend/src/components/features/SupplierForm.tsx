'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// 表单验证 Schema
const supplierSchema = z.object({
  code: z.string().min(1, '供应商编码不能为空'),
  name: z.string().min(1, '供应商名称不能为空'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// 表单 Props
interface SupplierFormProps {
  initialData?: Partial<SupplierFormData>;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

// 供应商表单组件
export const SupplierForm: React.FC<SupplierFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: '',
      name: '',
      contact: '',
      phone: '',
      address: '',
      ...initialData,
    },
  });
  
  // 当初始数据变化时重置表单
  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code || '',
        name: initialData.name || '',
        contact: initialData.contact || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
      });
    }
  }, [initialData, reset]);
  
  const handleFormSubmit = async (data: SupplierFormData) => {
    await onSubmit(data);
  };
  
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 供应商编码 */}
            <Input
              label="供应商编码"
              placeholder="请输入供应商编码"
              {...register('code')}
              error={errors.code?.message}
              disabled={isEdit}
              data-testid="input-code"
            />
            
            {/* 供应商名称 */}
            <Input
              label="供应商名称"
              placeholder="请输入供应商名称"
              {...register('name')}
              error={errors.name?.message}
              data-testid="input-name"
            />
          </div>
        </div>
        
        {/* 联系信息 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">联系信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 联系人 */}
            <Input
              label="联系人"
              placeholder="请输入联系人姓名"
              {...register('contact')}
              error={errors.contact?.message}
              data-testid="input-contact"
            />
            
            {/* 联系电话 */}
            <Input
              label="联系电话"
              placeholder="请输入联系电话"
              {...register('phone')}
              error={errors.phone?.message}
              data-testid="input-phone"
            />
          </div>
          
          {/* 地址 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              地址
            </label>
            <textarea
              className={`
                w-full px-4 py-2 text-sm rounded-lg border
                bg-white text-slate-900
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                ${errors.address ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
              `}
              placeholder="请输入详细地址"
              rows={3}
              {...register('address')}
              data-testid="input-address"
            />
            {errors.address && (
              <p className="mt-1.5 text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>
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
            {isEdit ? '保存修改' : '创建供应商'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default SupplierForm;
