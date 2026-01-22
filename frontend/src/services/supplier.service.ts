/**
 * 供应商 API 服务
 */
import { apiService, ApiResponse, PaginatedResponse } from './api';

// 供应商类型定义
export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

// 供应商查询参数
export interface SupplierQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

// 创建供应商参数
export interface CreateSupplierParams {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
}

// 更新供应商参数
export interface UpdateSupplierParams {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
}

// 供应商服务
export const supplierService = {
  /**
   * 获取供应商列表
   */
  async getSuppliers(params: SupplierQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.keyword) queryParams.keyword = params.keyword;
    
    return apiService.get<PaginatedResponse<Supplier>>('/suppliers', queryParams);
  },

  /**
   * 获取供应商详情
   */
  async getSupplier(id: number): Promise<ApiResponse<Supplier>> {
    return apiService.get<Supplier>(`/suppliers/${id}`);
  },

  /**
   * 创建供应商
   */
  async createSupplier(data: CreateSupplierParams): Promise<ApiResponse<Supplier>> {
    return apiService.post<Supplier>('/suppliers', data);
  },

  /**
   * 更新供应商
   */
  async updateSupplier(id: number, data: UpdateSupplierParams): Promise<ApiResponse<Supplier>> {
    return apiService.put<Supplier>(`/suppliers/${id}`, data);
  },

  /**
   * 删除供应商
   */
  async deleteSupplier(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/suppliers/${id}`);
  },

  /**
   * 获取所有供应商（用于下拉选择）
   */
  async getAllSuppliers(): Promise<ApiResponse<Supplier[]>> {
    // 获取所有供应商，不分页
    const response = await apiService.get<PaginatedResponse<Supplier>>('/suppliers', { pageSize: 1000 });
    return {
      code: response.code,
      message: response.message,
      data: response.data.list,
    };
  },
};

export default supplierService;
