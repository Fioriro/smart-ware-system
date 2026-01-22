'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { SupplierForm, SupplierFormData } from '@/components/features/SupplierForm';
import { supplierService } from '@/services/supplier.service';

// 返回图标
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// 新建供应商页面
export default function NewSupplierPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 处理表单提交
  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await supplierService.createSupplier({
        code: data.code,
        name: data.name,
        contact: data.contact || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });
      
      // 创建成功，跳转到供应商列表
      router.push('/suppliers');
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建供应商失败';
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
      title="新建供应商"
      subtitle="录入新供应商信息"
      actions={backButton}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">创建失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* 供应商表单 */}
      <SupplierForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </Layout>
  );
}
