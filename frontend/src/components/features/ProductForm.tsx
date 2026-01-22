'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCategories } from '@/hooks/useProducts';

// 表单验证 Schema
const productSchema = z.object({
  sku: z.string().min(1, 'SKU不能为空'),
  name: z.string().min(1, '商品名称不能为空'),
  categoryId: z.number().min(1, '请选择分类'),
  unit: z.string().min(1, '单位不能为空'),
  quantity: z.number().min(0, '库存不能为负数'),
  minThreshold: z.number().min(0, '预警阈值不能为负数'),
  costPrice: z.number().min(0, '成本价不能为负数').nullable(),
  salePrice: z.number().min(0, '销售价不能为负数').nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// 表单 Props
interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

// 商品表单组件
export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEdit = false,
  isSubmitting = false,
}) => {
  const { flatCategories, isLoading: categoriesLoading } = useCategories();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      categoryId: 0,
      unit: '',
      quantity: 0,
      minThreshold: 10,
      costPrice: null,
      salePrice: null,
      ...initialData,
    },
  });
  
  // 当初始数据变化时重置表单
  useEffect(() => {
    if (initialData) {
      reset({
        sku: initialData.sku || '',
        name: initialData.name || '',
        categoryId: initialData.categoryId || 0,
        unit: initialData.unit || '',
        quantity: initialData.quantity || 0,
        minThreshold: initialData.minThreshold || 10,
        costPrice: initialData.costPrice ?? null,
        salePrice: initialData.salePrice ?? null,
      });
    }
  }, [initialData, reset]);
  
  const categoryId = watch('categoryId');
  
  const handleFormSubmit = async (data: ProductFormData) => {
    await onSubmit(data);
  };
  
  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 基本信息 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">基本信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <Input
              label="SKU编码"
              placeholder="请输入SKU编码"
              {...register('sku')}
              error={errors.sku?.message}
              disabled={isEdit}
              data-testid="input-sku"
            />
            
            {/* 商品名称 */}
            <Input
              label="商品名称"
              placeholder="请输入商品名称"
              {...register('name')}
              error={errors.name?.message}
              data-testid="input-name"
            />
            
            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                商品分类
              </label>
              <select
                className={`
                  w-full px-4 py-2 text-sm rounded-lg border
                  bg-white text-slate-900
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
                  ${errors.categoryId ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
                `}
                value={categoryId || ''}
                onChange={(e) => setValue('categoryId', Number(e.target.value))}
                disabled={categoriesLoading}
                data-testid="select-category"
              >
                <option value="">请选择分类</option>
                {flatCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {'　'.repeat(category.level)}{category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1.5 text-sm text-red-500">{errors.categoryId.message}</p>
              )}
            </div>
            
            {/* 单位 */}
            <Input
              label="单位"
              placeholder="请输入单位（如：个、台、件）"
              {...register('unit')}
              error={errors.unit?.message}
              data-testid="input-unit"
            />
          </div>
        </div>
        
        {/* 库存信息 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">库存信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 库存数量 */}
            <Input
              label="库存数量"
              type="number"
              placeholder="请输入库存数量"
              {...register('quantity', { valueAsNumber: true })}
              error={errors.quantity?.message}
              data-testid="input-quantity"
            />
            
            {/* 预警阈值 */}
            <Input
              label="预警阈值"
              type="number"
              placeholder="请输入预警阈值"
              {...register('minThreshold', { valueAsNumber: true })}
              error={errors.minThreshold?.message}
              data-testid="input-threshold"
            />
          </div>
        </div>
        
        {/* 价格信息 */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">价格信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 成本价 */}
            <Input
              label="成本价（元）"
              type="number"
              step="0.01"
              placeholder="请输入成本价"
              {...register('costPrice', { 
                setValueAs: (v) => v === '' ? null : Number(v),
              })}
              error={errors.costPrice?.message}
              data-testid="input-cost-price"
            />
            
            {/* 销售价 */}
            <Input
              label="销售价（元）"
              type="number"
              step="0.01"
              placeholder="请输入销售价"
              {...register('salePrice', { 
                setValueAs: (v) => v === '' ? null : Number(v),
              })}
              error={errors.salePrice?.message}
              data-testid="input-sale-price"
            />
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
            {isEdit ? '保存修改' : '创建商品'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProductForm;
