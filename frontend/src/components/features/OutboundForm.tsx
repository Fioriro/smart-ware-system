'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDebounce } from '@/hooks';
import { productService, Product } from '@/services/product.service';

// 表单验证 Schema
const outboundSchema = z.object({
  sku: z.string().min(1, 'SKU不能为空'),
  quantity: z.number().min(1, '出库数量必须大于0'),
  remark: z.string().optional(),
});

export type OutboundFormData = z.infer<typeof outboundSchema>;

// 表单 Props
interface OutboundFormProps {
  initialSku?: string;
  onSubmit: (data: OutboundFormData) => Promise<void>;
  onReset?: () => void;
  isSubmitting?: boolean;
}

// 警告图标
const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

// 库存图标
const StockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

// 出库表单组件
export const OutboundForm: React.FC<OutboundFormProps> = ({
  initialSku = '',
  onSubmit,
  onReset,
  isSubmitting = false,
}) => {
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
  } = useForm<OutboundFormData>({
    resolver: zodResolver(outboundSchema),
    defaultValues: {
      sku: initialSku,
      quantity: 1,
      remark: '',
    },
  });
  
  const quantity = watch('quantity');
  
  // 计算库存是否不足
  const isStockInsufficient = product ? quantity > product.quantity : false;
  
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
  const handleFormSubmit = async (data: OutboundFormData) => {
    if (!product) {
      setProductError('请输入有效的SKU');
      return;
    }
    if (isStockInsufficient) {
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
          </div>
        </div>
        
        {/* 当前库存和出库数量 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 当前库存显示 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              当前库存
            </label>
            <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className={`text-2xl font-bold ${product && isStockInsufficient ? 'text-rose-600' : 'text-slate-700'}`}>
                {product?.quantity || 0}
              </span>
              <span className="text-sm text-slate-500">{product?.unit || '件'}</span>
            </div>
          </div>
          
          {/* 出库数量 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              出库数量 <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={product?.quantity || undefined}
              placeholder="请输入出库数量"
              className={`w-full p-4 rounded-xl bg-white border ${errors.quantity || isStockInsufficient ? 'border-red-500' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700`}
              {...register('quantity', { valueAsNumber: true })}
              data-testid="input-quantity"
            />
            {errors.quantity && (
              <p className="mt-1.5 text-sm text-red-500">{errors.quantity.message}</p>
            )}
          </div>
        </div>
        
        {/* 库存不足告警 */}
        {isStockInsufficient && (
          <div className="p-6 rounded-2xl border-l-4 border-l-rose-500 bg-rose-50/50" data-testid="stock-warning">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <WarningIcon className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">库存不足</p>
                <p className="text-slate-500 text-sm">
                  当前库存仅剩 <span className="text-rose-600 font-bold">{product?.quantity}</span> {product?.unit}，无法出库 {quantity} {product?.unit}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 备注 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            备注
          </label>
          <textarea
            className="w-full p-4 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 placeholder-slate-400 resize-none"
            placeholder="输入出库原因或备注信息（可选）"
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
            disabled={!product || isSubmitting || isStockInsufficient}
            className="flex-1 p-4"
            data-testid="submit-button"
          >
            确认出库
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default OutboundForm;
