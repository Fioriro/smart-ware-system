'use client';

import React from 'react';

// Pagination Props
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  disabled?: boolean;
}

// Pagination 组件
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  maxVisiblePages = 5,
  showFirstLast = true,
  disabled = false,
}) => {
  // 计算可见页码范围
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    const pages: (number | 'ellipsis')[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // 调整起始和结束页
    if (currentPage <= halfVisible) {
      endPage = maxVisiblePages;
    } else if (currentPage >= totalPages - halfVisible) {
      startPage = totalPages - maxVisiblePages + 1;
    }
    
    // 添加第一页
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis');
      }
    }
    
    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // 添加最后一页
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const visiblePages = getVisiblePages();
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      onPageChange(page);
    }
  };
  
  if (totalPages <= 1) return null;
  
  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="分页导航"
      data-testid="pagination"
    >
      {/* 首页按钮 */}
      {showFirstLast && (
        <PageButton
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          aria-label="首页"
        >
          <DoubleChevronLeftIcon className="w-4 h-4" />
        </PageButton>
      )}
      
      {/* 上一页按钮 */}
      <PageButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        aria-label="上一页"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </PageButton>
      
      {/* 页码 */}
      {showPageNumbers &&
        visiblePages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1 text-slate-400"
            >
              ...
            </span>
          ) : (
            <PageButton
              key={page}
              onClick={() => handlePageChange(page)}
              active={page === currentPage}
              disabled={disabled}
            >
              {page}
            </PageButton>
          )
        )}
      
      {/* 下一页按钮 */}
      <PageButton
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        aria-label="下一页"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </PageButton>
      
      {/* 末页按钮 */}
      {showFirstLast && (
        <PageButton
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          aria-label="末页"
        >
          <DoubleChevronRightIcon className="w-4 h-4" />
        </PageButton>
      )}
    </nav>
  );
};

// 页码按钮 Props
interface PageButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}

// 页码按钮组件
const PageButton: React.FC<PageButtonProps> = ({
  onClick,
  disabled = false,
  active = false,
  children,
  ...props
}) => {
  const baseStyles = `
    min-w-[36px] h-9 px-3
    flex items-center justify-center
    text-sm font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500/50
  `;
  
  const activeStyles = active
    ? 'bg-blue-500 text-white shadow-md'
    : 'text-slate-600 hover:bg-slate-100';
  
  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${activeStyles} ${disabledStyles}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 分页信息组件
interface PaginationInfoProps {
  currentPage: number;
  pageSize: number;
  total: number;
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  pageSize,
  total,
}) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  
  return (
    <div className="text-sm text-slate-500">
      显示 <span className="font-medium text-slate-700">{start}</span> -{' '}
      <span className="font-medium text-slate-700">{end}</span> 条，共{' '}
      <span className="font-medium text-slate-700">{total}</span> 条
    </div>
  );
};

// 图标组件
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const DoubleChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const DoubleChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

export default Pagination;
