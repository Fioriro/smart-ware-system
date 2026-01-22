'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAllSuppliers } from '@/hooks/useSuppliers';
import { useDebounce } from '@/hooks';
import { productService, Product } from '@/services/product.service';

// 表单验证 Schema
const inboundSchema = z.object({
  sku: z.string().min(1, 'SKU不能为空'),
  quantity: z.number().min(1, '入库数量必须大于0'),
  supplierId: z.number().min(1, '请选择供应商'),
  remark: z.string().optional(),
});

export type InboundFormData = z.infer<typeof inboundSchema>;

// 表单 Props
interface InboundFormProps {
  initialSku?: string;
  onSubmit: (data: InboundFormData) => Promise<void>;
  onReset?: () => void;
  isSubmitting?: boolean;
}

// 单个入库表单组件
export const InboundForm: React.FC<InboundFormProps> = ({
  initialSku = '',
  onSubmit,
  onReset,
  isSubmitting = false,
}) => {
  const { suppliers, isLoading: suppliersLoading } = useAllSuppliers();
  const [skuInput, setSkuInput] = useState(initialSku);
  const [product, setProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  
  // 防抖 SKU 输入
  const debouncedSku = useDebounce(skuInput, 300);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InboundFormData>({
    resolver: zodResolver(inboundSchema),
    defaultValues: {
      sku: initialSku,
      quantity: 1,
      supplierId: 0,
      remark: '',
    },
  });
  
  const supplierId = watch('supplierId');
  
  // 根据 SKU 查询商品
  const fetchProductBySku = useCallback(async (sku: string) => {
    if (!sku.trim()) {
      setProduct(null);
      setProductError(null);
      return;
    }
    
    setProductLoading(true);
    setProductError(null);
    
    try {
      const response = await productService.getProductBySku(sku);
      setProduct(response.data);
    } catch (err) {
      setProduct(null);
      setProductError('未找到该SKU对应的商品');
    } finally {
      setProductLoading(false);
    }
  }, []);
  
  // 监听防抖后的 SKU 变化
  useEffect(() => {
    fetchProductBySku(debouncedSku);
    setValue('sku', debouncedSku);
  }, [debouncedSku, fetchProductBySku, setValue]);
  
  // 初始化时如果有 initialSku，立即查询
  useEffect(() => {
    if (initialSku) {
      setSkuInput(initialSku);
    }
  }, [initialSku]);
  
  // 处理 SKU 输入变化
  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkuInput(e.target.value);
  };
  
  // 处理表单提交
  const handleFormSubmit = async (data: InboundFormData) => {
    if (!product) {
      setProductError('请输入有效的SKU');
      return;
    }
    await onSubmit(data);
  };
  
  // 处理重置
  const handleReset = () => {
    setSkuInput('');
    setProduct(null);
    setProductError(null);
    reset({
      sku: '',
      quantity: 1,
      supplierId: 0,
      remark: '',
    });
    onReset?.();
  };
  
  return (
    <Card className="p-10 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* SKU 和商品名称 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SKU 输入 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              SKU编码 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="输入或扫描SKU编码"
              value={skuInput}
              onChange={handleSkuChange}
              className={`w-full p-4 rounded-xl bg-white border ${errors.sku || productError ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-100 focus:border-slate-300 outline-none text-slate-700 placeholder-slate-400`}
              data-testid="input-sku"
            />
            {(errors.sku?.message || productError) && (
              <p className="mt-1.5 text-sm text-red-500">{errors.sku?.message || productError}</p>
            )}
            {productLoading && (
              <p className="mt-1.5 text-sm text-slate-500">正在查询商品...</p>
            )}
          </div>
          
          {/* 商品名称（只读） */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              商品名称
            </label>
            <input
              type="text"
              value={product?.name || ''}
              readOnly
              placeholder="自动匹配商品名称"
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500"
              data-testid="input-product-name"
            />
            {product && (
              <p className="mt-1.5 text-sm text-emerald-600">
                当前库存: {product.quantity} {product.unit}
              </p>
            )}
          </div>
        </div>
        
        {/* 供应商和数量 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 供应商选择 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              供应商 <span className="text-rose-500">*</span>
            </label>
            <select
              className={`w-full p-4 rounded-xl bg-white border ${errors.supplierId ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700`}
              value={supplierId || ''}
              onChange={(e) => setValue('supplierId', Number(e.target.value))}
              disabled={suppliersLoading}
              data-testid="select-supplier"
            >
              <option value="">请选择供应商</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {errors.supplierId && (
              <p className="mt-1.5 text-sm text-red-500">{errors.supplierId.message}</p>
            )}
          </div>
          
          {/* 入库数量 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              入库数量 <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="请输入入库数量"
              className={`w-full p-4 rounded-xl bg-white border ${errors.quantity ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700`}
              {...register('quantity', { valueAsNumber: true })}
              data-testid="input-quantity"
            />
            {errors.quantity && (
              <p className="mt-1.5 text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>
        </div>
        
        {/* 备注 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            备注
          </label>
          <textarea
            className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 placeholder-slate-400 resize-none"
            placeholder="输入备注信息（可选）"
            rows={3}
            {...register('remark')}
            data-testid="input-remark"
          />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="flex-1 p-4 rounded-xl border-2 border-slate-200 text-slate-500 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
          >
            重置
          </button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!product || isSubmitting}
            className="flex-1 p-4"
            data-testid="submit-button"
          >
            确认入库
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default InboundForm;
