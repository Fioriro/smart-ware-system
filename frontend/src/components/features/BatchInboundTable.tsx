'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAllSuppliers } from '@/hooks/useSuppliers';
import { useDebounce } from '@/hooks';
import { productService, Product } from '@/services/product.service';

// 批量入库行数据
export interface BatchInboundRow {
  id: string;
  sku: string;
  productName: string;
  product: Product | null;
  quantity: number;
  supplierId: number;
  remark: string;
  isLoading: boolean;
  error: string | null;
}

// 批量入库表格 Props
interface BatchInboundTableProps {
  onSubmit: (rows: BatchInboundRow[]) => Promise<void>;
  isSubmitting?: boolean;
}

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 创建空行
const createEmptyRow = (): BatchInboundRow => ({
  id: generateId(),
  sku: '',
  productName: '',
  product: null,
  quantity: 1,
  supplierId: 0,
  remark: '',
  isLoading: false,
  error: null,
});

// 图标组件
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// 单行 SKU 输入组件（带防抖）
const SkuInput: React.FC<{
  value: string;
  onChange: (sku: string) => void;
  onProductFound: (product: Product | null, error: string | null) => void;
  disabled?: boolean;
  error?: string | null;
}> = ({ value, onChange, onProductFound, disabled, error }) => {
  const [inputValue, setInputValue] = useState(value);
  const debouncedSku = useDebounce(inputValue, 300);
  
  // 同步外部值变化
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // 查询商品
  useEffect(() => {
    const fetchProduct = async () => {
      if (!debouncedSku.trim()) {
        onProductFound(null, null);
        return;
      }
      
      try {
        const response = await productService.getProductBySku(debouncedSku);
        onProductFound(response.data, null);
      } catch {
        onProductFound(null, '未找到商品');
      }
    };
    
    fetchProduct();
  }, [debouncedSku, onProductFound]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };
  
  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      disabled={disabled}
      placeholder="输入SKU"
      className={`
        w-full px-3 py-2 text-sm rounded-lg border
        bg-white text-slate-900
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
        disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
        ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-slate-300'}
      `}
      data-testid="batch-input-sku"
    />
  );
};

// 批量入库表格组件
export const BatchInboundTable: React.FC<BatchInboundTableProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const { suppliers, isLoading: suppliersLoading } = useAllSuppliers();
  const [rows, setRows] = useState<BatchInboundRow[]>([createEmptyRow()]);
  
  // 添加新行
  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, []);
  
  // 删除行
  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length === 1) {
        // 如果只剩一行，重置为空行
        return [createEmptyRow()];
      }
      return prev.filter((row) => row.id !== id);
    });
  }, []);
  
  // 更新行数据
  const updateRow = useCallback((id: string, updates: Partial<BatchInboundRow>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...updates } : row))
    );
  }, []);
  
  // 处理 SKU 变化
  const handleSkuChange = useCallback((id: string, sku: string) => {
    updateRow(id, { sku, isLoading: true });
  }, [updateRow]);
  
  // 处理商品查询结果
  const handleProductFound = useCallback((id: string, product: Product | null, error: string | null) => {
    updateRow(id, {
      product,
      productName: product?.name || '',
      isLoading: false,
      error,
    });
  }, [updateRow]);
  
  // 处理数量变化
  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    updateRow(id, { quantity: Math.max(1, quantity) });
  }, [updateRow]);
  
  // 处理供应商变化
  const handleSupplierChange = useCallback((id: string, supplierId: number) => {
    updateRow(id, { supplierId });
  }, [updateRow]);
  
  // 处理备注变化
  const handleRemarkChange = useCallback((id: string, remark: string) => {
    updateRow(id, { remark });
  }, [updateRow]);
  
  // 验证所有行
  const validateRows = useCallback((): boolean => {
    let isValid = true;
    const updatedRows = rows.map((row) => {
      const errors: string[] = [];
      
      if (!row.sku.trim()) {
        errors.push('SKU不能为空');
      } else if (!row.product) {
        errors.push('未找到商品');
      }
      
      if (row.quantity < 1) {
        errors.push('数量必须大于0');
      }
      
      if (!row.supplierId) {
        errors.push('请选择供应商');
      }
      
      if (errors.length > 0) {
        isValid = false;
        return { ...row, error: errors.join(', ') };
      }
      
      return { ...row, error: null };
    });
    
    setRows(updatedRows);
    return isValid;
  }, [rows]);
  
  // 处理提交
  const handleSubmit = async () => {
    if (!validateRows()) {
      return;
    }
    
    // 过滤掉空行
    const validRows = rows.filter((row) => row.sku.trim() && row.product);
    
    if (validRows.length === 0) {
      return;
    }
    
    await onSubmit(validRows);
  };
  
  // 重置表格
  const handleReset = () => {
    setRows([createEmptyRow()]);
  };
  
  // 检查是否有有效数据
  const hasValidData = rows.some((row) => row.sku.trim() && row.product && row.supplierId > 0);
  
  return (
    <Card className="p-6">
      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-36">
                SKU <span className="text-rose-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                商品名称
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">
                数量 <span className="text-rose-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-40">
                供应商 <span className="text-rose-500">*</span>
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                备注
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                className={`${row.error ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}
                data-testid={`batch-row-${row.id}`}
              >
                {/* SKU */}
                <td className="px-3 py-3">
                  <SkuInput
                    value={row.sku}
                    onChange={(sku) => handleSkuChange(row.id, sku)}
                    onProductFound={(product, error) => handleProductFound(row.id, product, error)}
                    disabled={isSubmitting}
                    error={row.error}
                  />
                </td>
                
                {/* 商品名称 */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {row.isLoading ? (
                      <span className="text-slate-400 text-sm">查询中...</span>
                    ) : (
                      <span className={row.product ? 'text-slate-700' : 'text-slate-400'}>
                        {row.productName || '自动匹配'}
                      </span>
                    )}
                  </div>
                </td>
                
                {/* 数量 */}
                <td className="px-3 py-3">
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => handleQuantityChange(row.id, parseInt(e.target.value) || 1)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-slate-50"
                    data-testid="batch-input-quantity"
                  />
                </td>
                
                {/* 供应商 */}
                <td className="px-3 py-3">
                  <select
                    value={row.supplierId || ''}
                    onChange={(e) => handleSupplierChange(row.id, Number(e.target.value))}
                    disabled={isSubmitting || suppliersLoading}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-slate-50"
                    data-testid="batch-select-supplier"
                  >
                    <option value="">选择供应商</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </td>
                
                {/* 备注 */}
                <td className="px-3 py-3">
                  <input
                    type="text"
                    value={row.remark}
                    onChange={(e) => handleRemarkChange(row.id, e.target.value)}
                    disabled={isSubmitting}
                    placeholder="可选"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:bg-slate-50"
                    data-testid="batch-input-remark"
                  />
                </td>
                
                {/* 操作 */}
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    disabled={isSubmitting}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                    data-testid="batch-delete-row"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 添加行按钮 */}
      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={addRow}
          disabled={isSubmitting}
          leftIcon={<PlusIcon className="w-4 h-4" />}
          data-testid="add-row-button"
        >
          添加一行
        </Button>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex gap-4 mt-6 pt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={isSubmitting}
          fullWidth
        >
          重置
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!hasValidData || isSubmitting}
          fullWidth
          data-testid="batch-submit-button"
        >
          批量入库
        </Button>
      </div>
    </Card>
  );
};

export default BatchInboundTable;
