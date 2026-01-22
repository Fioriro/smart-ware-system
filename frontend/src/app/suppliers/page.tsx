'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination, PaginationInfo } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/Modal';
import { useSuppliers } from '@/hooks/useSuppliers';
import { supplierService, Supplier } from '@/services/supplier.service';

// 图标组件
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BuildingIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const LocationIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 供应商列表页面
export default function SuppliersPage() {
  const router = useRouter();
  
  const {
    suppliers,
    total,
    page,
    pageSize,
    totalPages,
    keyword,
    isLoading,
    error,
    goToPage,
    search,
    refresh,
  } = useSuppliers();
  
  // 删除相关状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };
  
  // 打开删除确认框
  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await supplierService.deleteSupplier(supplierToDelete.id);
      refresh();
      setDeleteModalOpen(false);
      setSupplierToDelete(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除供应商失败';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 关闭删除确认框
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setSupplierToDelete(null);
    setDeleteError(null);
  };
  
  // 新建供应商按钮
  const addButton = (
    <Button
      variant="primary"
      leftIcon={<PlusIcon className="w-5 h-5" />}
      onClick={() => router.push('/suppliers/new')}
      data-testid="add-supplier-button"
    >
      新建供应商
    </Button>
  );
  
  return (
    <Layout
      title="供应商管理"
      subtitle="管理所有供应商信息"
      actions={addButton}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">获取数据失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      
      {/* 筛选区域 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索供应商编码或名称..."
              value={keyword}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 placeholder-slate-400"
              data-testid="search-input"
            />
          </div>
        </div>
      </Card>
      
      {/* 供应商卡片网格 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 bg-slate-200 rounded w-32 mb-2" />
                  <div className="h-4 bg-slate-100 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="py-12 text-center">
          <BuildingIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400">暂无供应商数据</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {suppliers.map((supplier) => (
            <Card
              key={supplier.id}
              className="p-6 transition-all hover:-translate-y-1"
              hover
              data-testid={`supplier-card-${supplier.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                    <BuildingIcon className="w-7 h-7 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-700">{supplier.name}</h3>
                    <p className="text-sm text-slate-500">{supplier.code}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                    onClick={() => router.push(`/suppliers/${supplier.id}/edit`)}
                    data-testid={`edit-button-${supplier.id}`}
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                    onClick={() => handleDeleteClick(supplier)}
                    data-testid={`delete-button-${supplier.id}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {supplier.contact && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    联系人：{supplier.contact}
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <PhoneIcon className="w-4 h-4 text-slate-400" />
                    电话：{supplier.phone}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <LocationIcon className="w-4 h-4 text-slate-400" />
                    地址：{supplier.address}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* 分页 */}
      {!isLoading && suppliers.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <PaginationInfo
            currentPage={page}
            pageSize={pageSize}
            total={total}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}
      
      {/* 删除确认对话框 */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        message={
          deleteError 
            ? deleteError 
            : `确定要删除供应商「${supplierToDelete?.name}」吗？此操作不可恢复。`
        }
        confirmText="删除"
        cancelText="取消"
        variant={deleteError ? 'warning' : 'danger'}
        loading={isDeleting}
      />
    </Layout>
  );
}
