'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination, PaginationInfo } from '@/components/ui/Pagination';
import { OutboundForm, OutboundFormData } from '@/components/features/OutboundForm';
import { useOutboundRecords } from '@/hooks/useInventory';
import { inventoryService } from '@/services/inventory.service';

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

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 出库管理页面
export default function OutboundPage() {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get('sku') || '';
  
  // 提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // 出库记录
  const {
    records,
    total,
    page,
    pageSize,
    totalPages,
    startDate,
    endDate,
    isLoading,
    error,
    goToPage,
    setDateRange,
    refresh,
  } = useOutboundRecords();
  
  // 处理出库提交
  const handleOutbound = useCallback(async (data: OutboundFormData) => {
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    
    try {
      await inventoryService.outbound({
        sku: data.sku,
        quantity: data.quantity,
        remark: data.remark,
      });
      setSubmitSuccess(true);
      refresh();
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '出库失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [refresh]);
  
  // 处理日期范围变化
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(e.target.value, endDate);
  };
  
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(startDate, e.target.value);
  };
  
  // 清除日期筛选
  const clearDateFilter = () => {
    setDateRange('', '');
  };
  
  return (
    <Layout title="出库指令中心" subtitle="录入商品出库信息">
      {/* 成功提示 */}
      {submitSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
          <p className="font-medium">✓ 出库成功！</p>
        </div>
      )}
      
      {/* 错误提示 */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">出库失败</p>
          <p className="text-sm mt-1">{submitError}</p>
        </div>
      )}
      
      {/* 出库表单 */}
      <div className="mb-8">
        <OutboundForm
          initialSku={initialSku}
          onSubmit={handleOutbound}
          isSubmitting={isSubmitting}
        />
      </div>
      
      {/* 出库记录列表 */}
      <Card padding="none">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-lg font-bold text-slate-700">最近出库记录</h3>
            
            <div className="flex items-center gap-4">
              {/* 日期范围筛选 */}
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <Input
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="w-36"
                  data-testid="filter-start-date"
                />
                <span className="text-slate-400">至</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="w-36"
                  data-testid="filter-end-date"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    清除
                  </button>
                )}
              </div>
              
              {/* 刷新按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                leftIcon={<RefreshIcon className="w-4 h-4" />}
                data-testid="refresh-records"
              >
                刷新
              </Button>
            </div>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm">
            获取记录失败: {error}
          </div>
        )}
        
        {/* 出库记录表格 */}
        <Table
          loading={isLoading}
          isEmpty={!isLoading && records.length === 0}
          emptyText="暂无出库记录"
        >
          <TableHead>
            <TableRow>
              <TableHeader>时间</TableHeader>
              <TableHeader>SKU</TableHeader>
              <TableHeader>商品名称</TableHeader>
              <TableHeader>数量</TableHeader>
              <TableHeader>操作人</TableHeader>
              <TableHeader>备注</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} data-testid={`record-row-${record.id}`}>
                <TableCell>
                  <span className="text-slate-500 text-sm">
                    {formatDateTime(record.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-700">{record.sku}</span>
                </TableCell>
                <TableCell>{record.productName}</TableCell>
                <TableCell>
                  <span className="text-lg font-bold text-rose-600">-{record.quantity}</span>
                </TableCell>
                <TableCell>
                  <span className="text-slate-600">{record.operatorName}</span>
                </TableCell>
                <TableCell>
                  <span className="text-slate-500 text-sm">{record.remark || '-'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* 分页 */}
        {!isLoading && records.length > 0 && (
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
    </Layout>
  );
}
