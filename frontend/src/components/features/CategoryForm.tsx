'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CategoryTreeNode, flattenCategories } from '@/services/category.service';

// 表单验证 Schema
const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称不能超过100个字符'),
  parentId: z.number().nullable(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// 表单 Props
interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  initialData?: {
    id?: number;
    name?: string;
    parentId?: number | null;
  };
  categories: CategoryTreeNode[];
  isEdit?: boolean;
  isSubmitting?: boolean;
}

// 获取分类及其所有子分类的ID（用于排除自己和子分类）
function getCategoryAndChildrenIds(
  categories: CategoryTreeNode[],
  targetId: number
): Set<number> {
  const ids = new Set<number>();
  
  const findAndCollect = (nodes: CategoryTreeNode[], found: boolean): boolean => {
    for (const node of nodes) {
      if (node.id === targetId || found) {
        ids.add(node.id);
        if (node.children) {
          findAndCollect(node.children, true);
        }
        if (node.id === targetId) {
          return true;
        }
      } else if (node.children) {
        if (findAndCollect(node.children, false)) {
          return true;
        }
      }
    }
    return false;
  };
  
  findAndCollect(categories, false);
  return ids;
}

// 分类表单组件
export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  isEdit = false,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      parentId: null,
    },
  });

  // 当初始数据变化时重置表单
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        parentId: initialData?.parentId ?? null,
      });
    }
  }, [isOpen, initialData, reset]);

  const parentId = watch('parentId');

  // 扁平化分类列表（用于下拉选择）
  const flatCategories = useMemo(() => {
    return flattenCategories(categories);
  }, [categories]);

  // 编辑时需要排除自己和子分类
  const excludedIds = useMemo(() => {
    if (isEdit && initialData?.id) {
      return getCategoryAndChildrenIds(categories, initialData.id);
    }
    return new Set<number>();
  }, [isEdit, initialData?.id, categories]);

  // 可选的父分类列表
  const availableParentCategories = useMemo(() => {
    return flatCategories.filter((cat) => !excludedIds.has(cat.id));
  }, [flatCategories, excludedIds]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const title = isEdit ? '编辑分类' : '新建分类';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        {/* 分类名称 */}
        <Input
          label="分类名称"
          placeholder="请输入分类名称"
          {...register('name')}
          error={errors.name?.message}
          data-testid="input-category-name"
        />

        {/* 父分类选择 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            父分类
          </label>
          <select
            className={`
              w-full px-4 py-2 text-sm rounded-lg border
              bg-white text-slate-900
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
              ${errors.parentId ? 'border-red-500' : 'border-slate-200 hover:border-slate-300'}
            `}
            value={parentId === null ? '' : parentId}
            onChange={(e) => {
              const value = e.target.value;
              setValue('parentId', value === '' ? null : Number(value));
            }}
            data-testid="select-parent-category"
          >
            <option value="">无（顶级分类）</option>
            {availableParentCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {'　'.repeat(category.level)}{category.name}
              </option>
            ))}
          </select>
          {errors.parentId && (
            <p className="mt-1.5 text-sm text-red-500">{errors.parentId.message}</p>
          )}
          {isEdit && initialData?.id && (
            <p className="mt-1.5 text-xs text-slate-500">
              注意：不能将分类设为自己或其子分类的子分类
            </p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            data-testid="submit-category-button"
          >
            {isEdit ? '保存修改' : '创建分类'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryForm;
