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

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
        <div className="flex items-center gap-4 flex-wrap">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[300px]">
            <Input
              placeholder="搜索供应商编码或名称..."
              value={keyword}
              onChange={handleSearch}
              leftIcon={<SearchIcon className="w-5 h-5" />}
              data-testid="search-input"
            />
          </div>
          
          {/* 刷新按钮 */}
          <Button
            variant="secondary"
            onClick={refresh}
            leftIcon={<RefreshIcon className="w-4 h-4" />}
            data-testid="refresh-button"
          >
            刷新
          </Button>
        </div>
      </Card>
      
      {/* 供应商表格 */}
      <Card padding="none">
        <Table
          loading={isLoading}
          isEmpty={!isLoading && suppliers.length === 0}
          emptyText="暂无供应商数据"
        >
          <TableHead>
            <TableRow>
              <TableHeader>编码</TableHeader>
              <TableHeader>名称</TableHeader>
              <TableHeader>联系人</TableHeader>
              <TableHeader>电话</TableHeader>
              <TableHeader>地址</TableHeader>
              <TableHeader>操作</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                data-testid={`supplier-row-${supplier.id}`}
              >
                <TableCell>
                  <span className="font-semibold text-slate-700">{supplier.code}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{supplier.name}</span>
                </TableCell>
                <TableCell>
                  {supplier.contact || <span className="text-slate-400">-</span>}
                </TableCell>
                <TableCell>
                  {supplier.phone ? (
                    <a 
                      href={`tel:${supplier.phone}`}
                      className="text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {supplier.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={supplier.address || ''}>
                    {supplier.address || <span className="text-slate-400">-</span>}
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* 分页 */}
        {!isLoading && suppliers.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
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
      </Card>
      
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
