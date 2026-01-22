'use client';

import React, { TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react';

// Table Props
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  loading?: boolean;
  emptyText?: string;
  isEmpty?: boolean;
}

// Table Header Props
interface TableHeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

// Table Row Props
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  highlight?: boolean;
  danger?: boolean;
}

// Table Cell Props
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
}

// Table 组件
export const Table: React.FC<TableProps> = ({
  loading = false,
  emptyText = '暂无数据',
  isEmpty = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table
        className={`w-full text-sm text-left ${className}`}
        data-testid="table"
        {...props}
      >
        {children}
      </table>
      
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-slate-500">加载中...</span>
        </div>
      )}
      
      {!loading && isEmpty && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <EmptyIcon className="w-12 h-12 mb-2" />
          <span>{emptyText}</span>
        </div>
      )}
    </div>
  );
};

// Table Head 组件
export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <thead
      className={`bg-slate-50 border-b border-slate-200 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

// Table Body 组件
export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

// Table Row 组件
export const TableRow: React.FC<TableRowProps> = ({
  highlight = false,
  danger = false,
  className = '',
  children,
  ...props
}) => {
  const baseStyles = 'transition-colors duration-150';
  const hoverStyles = 'hover:bg-slate-50';
  const highlightStyles = highlight ? 'bg-blue-50/50' : '';
  const dangerStyles = danger ? 'bg-red-50/50' : '';
  
  return (
    <tr
      className={`
        ${baseStyles}
        ${hoverStyles}
        ${highlightStyles}
        ${dangerStyles}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </tr>
  );
};

// Table Header Cell 组件
export const TableHeader: React.FC<TableHeaderProps> = ({
  sortable = false,
  sortDirection = null,
  onSort,
  className = '',
  children,
  ...props
}) => {
  const handleClick = () => {
    if (sortable && onSort) {
      onSort();
    }
  };
  
  return (
    <th
      className={`
        px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider
        ${sortable ? 'cursor-pointer select-none hover:bg-slate-100' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      onClick={handleClick}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <SortIcon direction={sortDirection} />
          </span>
        )}
      </div>
    </th>
  );
};

// Table Cell 组件
export const TableCell: React.FC<TableCellProps> = ({
  align = 'left',
  className = '',
  children,
  ...props
}) => {
  const alignStyles = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <td
      className={`
        px-4 py-3 text-slate-700
        ${alignStyles[align]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </td>
  );
};

// 排序图标
const SortIcon: React.FC<{ direction: 'asc' | 'desc' | null }> = ({
  direction,
}) => {
  return (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 10l4-4 4 4"
        stroke={direction === 'asc' ? '#3B82F6' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 14l4 4 4-4"
        stroke={direction === 'desc' ? '#3B82F6' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// 加载动画
const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin w-5 h-5 text-blue-500"
    xmlns="http://www.w3.org/2000/svg"
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
);

// 空状态图标
const EmptyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
    />
  </svg>
);

export default Table;
