'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SupplierForm, SupplierFormData } from '@/components/features/SupplierForm';
import { supplierService, Supplier } from '@/services/supplier.service';

// 返回图标
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// 加载骨架屏
const FormSkeleton = () => (
  <Card className="p-6">
    <div className="animate-pulse space-y-6">
      <div>
        <div className="h-6 w-24 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-24 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  </Card>
);

// 编辑供应商页面
export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = Number(params.id);
  
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // 加载供应商数据
  useEffect(() => {
    const loadSupplier = async () => {
      if (!supplierId || isNaN(supplierId)) {
        setLoadError('无效的供应商ID');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await supplierService.getSupplier(supplierId);
        setSupplier(response.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载供应商失败';
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSupplier();
  }, [supplierId]);
  
  // 处理表单提交
  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await supplierService.updateSupplier(supplierId, {
        name: data.name,
        contact: data.contact || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      });
      
      // 更新成功，跳转到供应商列表
      router.push('/suppliers');
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新供应商失败';
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
  
  // 转换供应商数据为表单初始值
  const initialData: Partial<SupplierFormData> | undefined = supplier
    ? {
        code: supplier.code,
        name: supplier.name,
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      }
    : undefined;
  
  return (
    <Layout
      title="编辑供应商"
      subtitle={supplier ? `编辑供应商：${supplier.name}` : '加载中...'}
      actions={backButton}
    >
      {/* 加载错误提示 */}
      {loadError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">{loadError}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => router.push('/suppliers')}
          >
            返回供应商列表
          </Button>
        </div>
      )}
      
      {/* 提交错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">更新失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* 加载中 */}
      {isLoading && <FormSkeleton />}
      
      {/* 供应商表单 */}
      {!isLoading && !loadError && supplier && (
        <SupplierForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEdit={true}
          isSubmitting={isSubmitting}
        />
      )}
    </Layout>
  );
}
