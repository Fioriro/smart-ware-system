'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Pagination, PaginationInfo } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/Modal';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { productService, Product } from '@/services/product.service';

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

// 格式化价格
const formatPrice = (price: number | null): string => {
  if (price === null || price === undefined) return '-';
  return `¥${price.toFixed(2)}`;
};

// 商品列表页面
export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 参数获取初始筛选条件
  const initialLowStock = searchParams.get('lowStock') === 'true';
  
  const {
    products,
    total,
    page,
    pageSize,
    totalPages,
    keyword,
    categoryId,
    lowStock,
    isLoading,
    error,
    goToPage,
    search,
    filterByCategory,
    filterLowStock,
    refresh,
  } = useProducts({ lowStock: initialLowStock });
  
  const { flatCategories } = useCategories();
  
  // 删除相关状态
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [secondConfirmOpen, setSecondConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 同步 URL 参数
  useEffect(() => {
    if (initialLowStock && !lowStock) {
      filterLowStock(true);
    }
  }, [initialLowStock, lowStock, filterLowStock]);
  
  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };
  
  // 处理分类筛选
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    filterByCategory(value ? Number(value) : undefined);
  };
  
  // 处理低库存筛选
  const handleLowStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    filterLowStock(e.target.checked);
  };
  
  // 打开删除确认框
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };
  
  // 确认删除
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    // 如果有库存，需要二次确认
    if (productToDelete.quantity > 0 && !secondConfirmOpen) {
      setDeleteModalOpen(false);
      setSecondConfirmOpen(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      await productService.deleteProduct(productToDelete.id);
      refresh();
      setDeleteModalOpen(false);
      setSecondConfirmOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('删除商品失败:', err);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // 关闭删除确认框
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setSecondConfirmOpen(false);
    setProductToDelete(null);
  };
  
  // 新建商品按钮
  const addButton = (
    <Button
      variant="primary"
      leftIcon={<PlusIcon className="w-5 h-5" />}
      onClick={() => router.push('/products/new')}
      data-testid="add-product-button"
    >
      新增商品
    </Button>
  );
  
  return (
    <Layout
      title="库存资产清单"
      subtitle="管理所有商品信息"
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
              placeholder="搜索SKU或商品名称..."
              value={keyword}
              onChange={handleSearch}
              leftIcon={<SearchIcon className="w-5 h-5" />}
              data-testid="search-input"
            />
          </div>
          
          {/* 分类筛选 */}
          <select
            className="px-5 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-700 font-medium"
            value={categoryId || ''}
            onChange={handleCategoryChange}
            data-testid="category-filter"
          >
            <option value="">全部分类</option>
            {flatCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {'　'.repeat(category.level)}{category.name}
              </option>
            ))}
          </select>
          
          {/* 低库存筛选 */}
          <label className="flex items-center gap-2 cursor-pointer bg-rose-50 px-4 py-2 rounded-lg border border-rose-100">
            <input
              type="checkbox"
              className="w-5 h-5 text-rose-500 rounded-lg"
              checked={lowStock}
              onChange={handleLowStockChange}
              data-testid="low-stock-filter"
            />
            <span className="text-sm font-medium text-rose-600">仅显示低库存</span>
          </label>
          
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
      
      {/* 商品表格 */}
      <Card padding="none">
        <Table
          loading={isLoading}
          isEmpty={!isLoading && products.length === 0}
          emptyText="暂无商品数据"
        >
          <TableHead>
            <TableRow>
              <TableHeader>SKU</TableHeader>
              <TableHeader>商品名称</TableHeader>
              <TableHeader>分类</TableHeader>
              <TableHeader>单位</TableHeader>
              <TableHeader>库存数量</TableHeader>
              <TableHeader>预警阈值</TableHeader>
              <TableHeader>成本价</TableHeader>
              <TableHeader>售价</TableHeader>
              <TableHeader>操作</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                danger={product.isLowStock}
                data-testid={`product-row-${product.id}`}
              >
                <TableCell>
                  <span className="font-semibold text-slate-700">{product.sku}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    {product.isLowStock && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
                        低库存
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                    {product.categoryName || '-'}
                  </span>
                </TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  <span className={`font-bold ${product.isLowStock ? 'text-rose-600' : 'text-slate-700'}`}>
                    {product.quantity}
                  </span>
                </TableCell>
                <TableCell>{product.minThreshold}</TableCell>
                <TableCell>{formatPrice(product.costPrice)}</TableCell>
                <TableCell>
                  <span className="font-medium">{formatPrice(product.salePrice)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {product.isLowStock && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 hover:bg-emerald-50"
                        onClick={() => router.push(`/inbound?sku=${product.sku}`)}
                        data-testid={`restock-button-${product.id}`}
                      >
                        补货
                      </Button>
                    )}
                    <button
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition"
                      onClick={() => router.push(`/products/${product.id}/edit`)}
                      data-testid={`edit-button-${product.id}`}
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      onClick={() => handleDeleteClick(product)}
                      data-testid={`delete-button-${product.id}`}
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
        {!isLoading && products.length > 0 && (
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
        message={`确定要删除商品「${productToDelete?.name}」吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        loading={isDeleting}
      />
      
      {/* 有库存商品二次确认对话框 */}
      <ConfirmModal
        isOpen={secondConfirmOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="警告：商品有库存"
        message={`商品「${productToDelete?.name}」当前库存为 ${productToDelete?.quantity}，确定要删除吗？删除后库存数据将丢失！`}
        confirmText="确认删除"
        cancelText="取消"
        variant="warning"
        loading={isDeleting}
      />
    </Layout>
  );
}
