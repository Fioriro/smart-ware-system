'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { ProductForm, ProductFormData } from '@/components/features/ProductForm';
import { productService } from '@/services/product.service';

// 返回图标
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// 新建商品页面
export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 处理表单提交
  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await productService.createProduct({
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        quantity: data.quantity,
        minThreshold: data.minThreshold,
        costPrice: data.costPrice ?? undefined,
        salePrice: data.salePrice ?? undefined,
      });
      
      // 创建成功，跳转到商品列表
      router.push('/products');
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建商品失败';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 处理取消
  const handleCancel = () => {
    router.back();
  };
  
  // 返回按钮
  const backButton = (
    <Button
      variant="ghost"
      leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
      onClick={() => router.back()}
    >
      返回
    </Button>
  );
  
  return (
    <Layout
      title="新建商品"
      subtitle="录入新商品信息"
      actions={backButton}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">创建失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* 商品表单 */}
      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </Layout>
  );
}
