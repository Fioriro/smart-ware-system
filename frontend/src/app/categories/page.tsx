'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { CategoryTree } from '@/components/features/CategoryTree';
import { CategoryForm, CategoryFormData } from '@/components/features/CategoryForm';
import { SkeletonCategoryTree } from '@/components/ui/Skeleton';
import { useCategories } from '@/hooks/useProducts';
import { categoryService, CategoryTreeNode } from '@/services/category.service';

// 图标组件
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// 分类管理页面
export default function CategoriesPage() {
  const { categories, isLoading, error, refresh } = useCategories();

  // 表单弹窗状态
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formInitialData, setFormInitialData] = useState<{
    id?: number;
    name?: string;
    parentId?: number | null;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 删除确认弹窗状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTreeNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 打开新建分类弹窗
  const handleAddCategory = useCallback((parentId: number | null = null) => {
    setFormMode('create');
    setFormInitialData({ parentId });
    setFormOpen(true);
  }, []);

  // 打开编辑分类弹窗
  const handleEditCategory = useCallback((category: CategoryTreeNode) => {
    setFormMode('edit');
    setFormInitialData({
      id: category.id,
      name: category.name,
      parentId: category.parentId,
    });
    setFormOpen(true);
  }, []);

  // 关闭表单弹窗
  const handleCloseForm = useCallback(() => {
    setFormOpen(false);
    setFormInitialData({});
  }, []);

  // 提交表单
  const handleSubmitForm = useCallback(
    async (data: CategoryFormData) => {
      setIsSubmitting(true);
      try {
        if (formMode === 'create') {
          await categoryService.createCategory({
            name: data.name,
            parentId: data.parentId ?? undefined,
          });
        } else if (formInitialData.id) {
          await categoryService.updateCategory(formInitialData.id, {
            name: data.name,
            parentId: data.parentId ?? undefined,
          });
        }
        handleCloseForm();
        refresh();
      } catch (err: unknown) {
        console.error('保存分类失败:', err);
        // 可以在这里添加错误提示
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMode, formInitialData.id, handleCloseForm, refresh]
  );

  // 打开删除确认弹窗
  const handleDeleteClick = useCallback((category: CategoryTreeNode) => {
    setCategoryToDelete(category);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    // 检查是否有子分类
    if (categoryToDelete.children && categoryToDelete.children.length > 0) {
      setDeleteError('该分类下有子分类，请先删除子分类');
      return;
    }

    // 检查是否有关联商品
    if (categoryToDelete.productCount && categoryToDelete.productCount > 0) {
      setDeleteError(`该分类下有 ${categoryToDelete.productCount} 件商品，请先移除商品关联`);
      return;
    }

    setIsDeleting(true);
    try {
      await categoryService.deleteCategory(categoryToDelete.id);
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      setDeleteError(null);
      refresh();
    } catch (err: unknown) {
      console.error('删除分类失败:', err);
      const errorMessage = err instanceof Error ? err.message : '删除失败，请稍后重试';
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [categoryToDelete, refresh]);

  // 关闭删除确认弹窗
  const handleCancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setCategoryToDelete(null);
    setDeleteError(null);
  }, []);

  // 操作按钮
  const actions = (
    <div className="flex items-center gap-3">
      <Button
        variant="secondary"
        onClick={() => refresh()}
        leftIcon={<RefreshIcon className="w-4 h-4" />}
        data-testid="refresh-button"
      >
        刷新
      </Button>
      <Button
        variant="primary"
        onClick={() => handleAddCategory(null)}
        leftIcon={<PlusIcon className="w-5 h-5" />}
        data-testid="add-category-button"
      >
        新增分类
      </Button>
    </div>
  );

  return (
    <Layout
      title="商品分类管理"
      subtitle="管理商品分类层级结构"
      actions={actions}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">获取数据失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 分类树卡片 */}
      <Card padding="none">
        {isLoading ? (
          <SkeletonCategoryTree rows={6} />
        ) : (
          <CategoryTree
            categories={categories}
            onAddChild={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteClick}
            loading={false}
          />
        )}
      </Card>

      {/* 新建/编辑分类弹窗 */}
      <CategoryForm
        isOpen={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        initialData={formInitialData}
        categories={categories}
        isEdit={formMode === 'edit'}
        isSubmitting={isSubmitting}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="确认删除"
        message={
          deleteError
            ? deleteError
            : `确定要删除分类「${categoryToDelete?.name}」吗？此操作不可恢复。`
        }
        confirmText={deleteError ? '知道了' : '删除'}
        cancelText="取消"
        variant={deleteError ? 'warning' : 'danger'}
        loading={isDeleting}
      />
    </Layout>
  );
}
