'use client';

import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination, PaginationInfo } from '@/components/ui/Pagination';
import { SkeletonLogItem } from '@/components/ui/Skeleton';
import { useLogs } from '@/hooks/useLogs';
import { OperationType } from '@/services/log.service';

// 图标组件
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);


// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 日志项组件
interface LogItemProps {
  log: {
    id: number;
    operationTime: string;
    operator: string;
    operationType: OperationType;
    operationTypeLabel: string;
    sku: string;
    productName: string;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    remark: string | null;
  };
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  const isInbound = log.operationType === 'IN';
  
  return (
    <Card
      className="p-5 flex justify-between items-center hover:shadow-lg transition-all hover:-translate-y-0.5"
      hover
      data-testid={`log-item-${log.id}`}
    >
      <div className="flex gap-4 items-center">
        <span
          className={`px-4 py-2 rounded-xl text-xs font-bold ${
            isInbound
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-100 text-slate-600'
          }`}
          data-testid={`log-type-${log.id}`}
        >
          {log.operationTypeLabel}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            操作人 <span className="text-slate-500">{log.operator}</span> 将{' '}
            <span className="font-bold">[{log.productName}]</span>{' '}
            {isInbound ? '增加' : '减少'}了{' '}
            <span className={`font-bold ${isInbound ? 'text-emerald-600' : 'text-rose-600'}`}>
              {Math.abs(log.quantityChange)}
            </span>{' '}
            件
          </p>
          <p className="text-xs text-slate-500 mt-1">
            SKU: {log.sku} | 变化前: {log.quantityBefore} → 变化后: {log.quantityAfter}
            {log.remark && ` | 备注: ${log.remark}`}
          </p>
        </div>
      </div>
      <span className="text-slate-400 text-sm font-medium whitespace-nowrap">
        {formatDateTime(log.operationTime)}
      </span>
    </Card>
  );
};


// 审计日志页面
export default function LogsPage() {
  const {
    logs,
    total,
    page,
    pageSize,
    totalPages,
    startDate,
    endDate,
    operationType,
    keyword,
    isLoading,
    error,
    isExporting,
    exportError,
    goToPage,
    setDateRange,
    filterByOperationType,
    searchKeyword,
    refresh,
    resetFilters,
    exportToExcel,
    clearExportError,
  } = useLogs();

  // 处理日期范围变化
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(e.target.value, endDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(startDate, e.target.value);
  };

  // 处理操作类型变化
  const handleOperationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    filterByOperationType(e.target.value as OperationType | '');
  };

  // 处理搜索关键词变化
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchKeyword(e.target.value);
  };

  // 清除所有筛选
  const handleClearFilters = () => {
    resetFilters();
  };

  // 是否有筛选条件
  const hasFilters = startDate || endDate || operationType || keyword;

  return (
    <Layout title="操作溯源" subtitle="查看所有库存变动的审计记录">
      {/* 导出错误提示 */}
      {exportError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <div>
            <p className="font-medium">导出失败</p>
            <p className="text-sm mt-1">{exportError}</p>
          </div>
          <button
            onClick={clearExportError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 筛选区域 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 时间范围筛选 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-500">时间范围</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-700"
              data-testid="filter-start-date"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="px-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-700"
              data-testid="filter-end-date"
            />
          </div>

          {/* 操作类型筛选 */}
          <select
            value={operationType}
            onChange={handleOperationTypeChange}
            className="px-5 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-700 font-medium"
            data-testid="filter-operation-type"
          >
            <option value="">全部类型</option>
            <option value="IN">入库</option>
            <option value="OUT">出库</option>
          </select>

          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px] relative">
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索SKU或操作人..."
              value={keyword}
              onChange={handleKeywordChange}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm text-slate-700 placeholder-slate-400"
              data-testid="filter-keyword"
            />
          </div>

          {/* 查询按钮 */}
          <Button
            variant="primary"
            onClick={refresh}
            data-testid="query-button"
          >
            查询
          </Button>
          
          {/* 导出按钮 */}
          <Button
            variant="secondary"
            onClick={exportToExcel}
            loading={isExporting}
            leftIcon={<DownloadIcon className="w-5 h-5" />}
            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
            data-testid="export-excel"
          >
            导出Excel
          </Button>
        </div>
      </Card>


      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">获取日志失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 日志列表 */}
      <div className="space-y-4">
        {isLoading ? (
          // 骨架屏加载状态
          <>
            <SkeletonLogItem />
            <SkeletonLogItem />
            <SkeletonLogItem />
            <SkeletonLogItem />
            <SkeletonLogItem />
          </>
        ) : logs.length === 0 ? (
          <Card className="py-12 text-center">
            <svg
              className="w-12 h-12 mx-auto text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-400">暂无审计日志</p>
          </Card>
        ) : (
          logs.map((log) => (
            <LogItem key={log.id} log={log} />
          ))
        )}
      </div>

      {/* 分页 */}
      {!isLoading && logs.length > 0 && (
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
    </Layout>
  );
}
