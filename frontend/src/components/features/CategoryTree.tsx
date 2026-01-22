'use client';

import React, { useState, useCallback } from 'react';
import { CategoryTreeNode } from '@/services/category.service';

// 图标组件
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const FolderOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
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

// 树节点 Props
interface CategoryTreeItemProps {
  category: CategoryTreeNode;
  level: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onAddChild: (parentId: number) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
}

// 树节点组件
const CategoryTreeItem: React.FC<CategoryTreeItemProps> = ({
  category,
  level,
  expandedIds,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedIds.has(category.id);
  const indentPx = level * 24;

  return (
    <div data-testid={`category-item-${category.id}`}>
      {/* 节点行 */}
      <div
        className="group flex items-center py-3 px-4 hover:bg-slate-50/80 transition-colors border-b border-slate-100 last:border-b-0"
        style={{ paddingLeft: `${16 + indentPx}px` }}
      >
        {/* 展开/折叠按钮 */}
        <button
          className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors mr-2 ${
            hasChildren
              ? 'hover:bg-slate-200 text-slate-500'
              : 'text-transparent cursor-default'
          }`}
          onClick={() => hasChildren && onToggle(category.id)}
          disabled={!hasChildren}
          data-testid={`toggle-${category.id}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* 文件夹图标 */}
        <span className="mr-3 text-blue-500">
          {hasChildren && isExpanded ? (
            <FolderOpenIcon className="w-5 h-5" />
          ) : (
            <FolderIcon className="w-5 h-5" />
          )}
        </span>

        {/* 分类名称 */}
        <span className="flex-1 font-medium text-slate-700">{category.name}</span>

        {/* 商品数量徽章 */}
        <span
          className={`px-2.5 py-0.5 text-xs font-semibold rounded-full mr-4 ${
            (category.productCount || 0) > 0
              ? 'bg-blue-100 text-blue-600'
              : 'bg-slate-100 text-slate-500'
          }`}
          data-testid={`product-count-${category.id}`}
        >
          {category.productCount || 0} 件商品
        </span>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 添加子分类 */}
          <button
            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
            onClick={() => onAddChild(category.id)}
            title="添加子分类"
            data-testid={`add-child-${category.id}`}
          >
            <PlusIcon className="w-4 h-4" />
          </button>

          {/* 编辑 */}
          <button
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => onEdit(category)}
            title="编辑分类"
            data-testid={`edit-${category.id}`}
          >
            <EditIcon className="w-4 h-4" />
          </button>

          {/* 删除 */}
          <button
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
            onClick={() => onDelete(category)}
            title="删除分类"
            data-testid={`delete-${category.id}`}
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 子节点 */}
      {hasChildren && isExpanded && (
        <div data-testid={`children-${category.id}`}>
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// CategoryTree Props
interface CategoryTreeProps {
  categories: CategoryTreeNode[];
  onAddChild: (parentId: number | null) => void;
  onEdit: (category: CategoryTreeNode) => void;
  onDelete: (category: CategoryTreeNode) => void;
  loading?: boolean;
}

// CategoryTree 组件
export const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onAddChild,
  onEdit,
  onDelete,
  loading = false,
}) => {
  // 展开状态管理
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // 切换展开/折叠
  const handleToggle = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 全部展开
  const expandAll = useCallback(() => {
    const getAllIds = (nodes: CategoryTreeNode[]): number[] => {
      return nodes.flatMap((node) => [
        node.id,
        ...(node.children ? getAllIds(node.children) : []),
      ]);
    };
    setExpandedIds(new Set(getAllIds(categories)));
  }, [categories]);

  // 全部折叠
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500">
          <svg
            className="animate-spin w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  // 空状态
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <FolderIcon className="w-12 h-12 mb-4 text-slate-300" />
        <p className="text-lg font-medium mb-2">暂无分类数据</p>
        <p className="text-sm mb-4">点击上方按钮创建第一个分类</p>
      </div>
    );
  }

  return (
    <div>
      {/* 工具栏 */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <button
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          onClick={expandAll}
          data-testid="expand-all"
        >
          全部展开
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          onClick={collapseAll}
          data-testid="collapse-all"
        >
          全部折叠
        </button>
      </div>

      {/* 树形列表 */}
      <div data-testid="category-tree">
        {categories.map((category) => (
          <CategoryTreeItem
            key={category.id}
            category={category}
            level={0}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryTree;
