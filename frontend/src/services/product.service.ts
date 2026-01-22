/**
 * 商品 API 服务
 */
import { apiService, ApiResponse, PaginatedResponse } from './api';

// 商品类型定义
export interface Product {
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  categoryName?: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  costPrice: number | null;
  salePrice: number | null;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

// 商品查询参数
export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  categoryId?: number;
  lowStock?: boolean;
}

// 创建商品参数
export interface CreateProductParams {
  sku: string;
  name: string;
  categoryId: number;
  unit: string;
  quantity?: number;
  minThreshold?: number;
  costPrice?: number;
  salePrice?: number;
}

// 更新商品参数
export interface UpdateProductParams {
  name?: string;
  categoryId?: number;
  unit?: string;
  quantity?: number;
  minThreshold?: number;
  costPrice?: number;
  salePrice?: number;
}

// 商品服务
export const productService = {
  /**
   * 获取商品列表
   */
  async getProducts(params: ProductQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.categoryId) queryParams.categoryId = params.categoryId;
    if (params.lowStock !== undefined) queryParams.lowStock = params.lowStock;
    
    return apiService.get<PaginatedResponse<Product>>('/products', queryParams);
  },

  /**
   * 获取商品详情
   */
  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return apiService.get<Product>(`/products/${id}`);
  },

  /**
   * 根据 SKU 获取商品
   */
  async getProductBySku(sku: string): Promise<ApiResponse<Product>> {
    return apiService.get<Product>(`/products/sku/${sku}`);
  },

  /**
   * 获取低库存商品列表
   */
  async getLowStockProducts(): Promise<ApiResponse<Product[]>> {
    return apiService.get<Product[]>('/products/low-stock');
  },

  /**
   * 创建商品
   */
  async createProduct(data: CreateProductParams): Promise<ApiResponse<Product>> {
    return apiService.post<Product>('/products', data);
  },

  /**
   * 更新商品
   */
  async updateProduct(id: number, data: UpdateProductParams): Promise<ApiResponse<Product>> {
    return apiService.put<Product>(`/products/${id}`, data);
  },

  /**
   * 删除商品
   */
  async deleteProduct(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/products/${id}`);
  },
};

export default productService;
