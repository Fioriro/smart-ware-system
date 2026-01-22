'use client';

import React from 'react';

/**
 * 基础骨架屏组件
 * 用于在数据加载时显示占位内容
 */

// 基础骨架屏 Props
interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

// 基础骨架屏组件
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}) => {
  const roundedStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`
        bg-slate-200 
        ${roundedStyles[rounded]} 
        ${animate ? 'animate-pulse' : ''} 
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={style}
      data-testid="skeleton"
    />
  );
};

// 文本骨架屏 Props
interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
  lastLineWidth?: string;
}

// 文本骨架屏组件
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = '',
  lineHeight = 'h-4',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={`space-y-3 ${className}`} data-testid="skeleton-text">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

// 卡片骨架屏 Props
interface SkeletonCardProps {
  className?: string;
  showImage?: boolean;
  imageHeight?: string;
  lines?: number;
}

// 卡片骨架屏组件
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  showImage = false,
  imageHeight = 'h-40',
  lines = 3,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 overflow-hidden ${className}`}
      data-testid="skeleton-card"
    >
      {showImage && <Skeleton className={`w-full ${imageHeight}`} rounded="none" />}
      <div className="p-4">
        <SkeletonText lines={lines} />
      </div>
    </div>
  );
};

// 表格行骨架屏 Props
interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

// 表格行骨架屏组件
export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns = 5,
  className = '',
}) => {
  return (
    <tr className={`border-b border-slate-100 ${className}`} data-testid="skeleton-table-row">
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <Skeleton className="h-4" width={index === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
};

// 表格骨架屏 Props
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

// 表格骨架屏组件
export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 5,
  className = '',
  showHeader = true,
}) => {
  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`} data-testid="skeleton-table">
      <table className="w-full">
        {showHeader && (
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-4 py-3">
                  <Skeleton className="h-3" width="70%" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 列表项骨架屏 Props
interface SkeletonListItemProps {
  showAvatar?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
  lines?: number;
  className?: string;
}

// 列表项骨架屏组件
export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  showAvatar = true,
  avatarSize = 'md',
  lines = 2,
  className = '',
}) => {
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex items-center gap-4 p-4 ${className}`} data-testid="skeleton-list-item">
      {showAvatar && (
        <Skeleton className={avatarSizes[avatarSize]} rounded="full" />
      )}
      <div className="flex-1">
        <SkeletonText lines={lines} lineHeight="h-3" />
      </div>
    </div>
  );
};

// 统计卡片骨架屏 Props
interface SkeletonStatCardProps {
  className?: string;
}

// 统计卡片骨架屏组件（用于仪表盘）
export const SkeletonStatCard: React.FC<SkeletonStatCardProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 p-8 ${className}`}
      data-testid="skeleton-stat-card"
    >
      <div className="flex items-center justify-between animate-pulse">
        <div>
          <Skeleton className="h-4 w-20 mb-3" />
          <Skeleton className="h-10 w-24 mb-2" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="w-14 h-14" rounded="xl" />
      </div>
    </div>
  );
};

// 日志项骨架屏组件
export const SkeletonLogItem: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 p-5 ${className}`}
      data-testid="skeleton-log-item"
    >
      <div className="flex justify-between items-center animate-pulse">
        <div className="flex gap-4 items-center">
          <Skeleton className="w-16 h-8" rounded="xl" />
          <div>
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

// 用户行骨架屏组件
export const SkeletonUserRow: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <tr className={`border-b border-slate-100 animate-pulse ${className}`} data-testid="skeleton-user-row">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8" rounded="full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-16" rounded="full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-6 w-12" rounded="full" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="w-8 h-8" rounded="lg" />
          <Skeleton className="w-8 h-8" rounded="lg" />
        </div>
      </td>
    </tr>
  );
};

// 筛选区域骨架屏组件
export const SkeletonFilterBar: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      className={`bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-100 p-6 ${className}`}
      data-testid="skeleton-filter-bar"
    >
      <div className="flex items-center gap-4 flex-wrap animate-pulse">
        <Skeleton className="h-10 flex-1 min-w-[200px]" rounded="lg" />
        <Skeleton className="h-10 w-32" rounded="lg" />
        <Skeleton className="h-10 w-24" rounded="lg" />
      </div>
    </div>
  );
};

// 分类树骨架屏组件
export const SkeletonCategoryTree: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={className} data-testid="skeleton-category-tree">
      {/* 工具栏 */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 animate-pulse">
        <Skeleton className="h-7 w-20" rounded="lg" />
        <Skeleton className="h-7 w-20" rounded="lg" />
      </div>
      {/* 树形列表 */}
      <div className="animate-pulse">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center py-3 px-4 border-b border-slate-100"
            style={{ paddingLeft: `${16 + (index % 3) * 24}px` }}
          >
            <Skeleton className="w-6 h-6 mr-2" rounded="lg" />
            <Skeleton className="w-5 h-5 mr-3" />
            <Skeleton className="h-4 flex-1 max-w-[200px]" />
            <Skeleton className="h-6 w-16 ml-auto mr-4" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
