/**
 * 库存 API 服务
 */
import { apiService, ApiResponse, PaginatedResponse } from './api';

// 入库记录类型定义
export interface InboundRecord {
  id: number;
  type: 'IN';
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  supplierId: number | null;
  supplierName: string | null;
  operatorId: number;
  operatorName: string;
  remark: string | null;
  createdAt: string;
}

// 出库记录类型定义
export interface OutboundRecord {
  id: number;
  type: 'OUT';
  productId: number;
  sku: string;
  productName: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  operatorId: number;
  operatorName: string;
  remark: string | null;
  createdAt: string;
}

// 入库记录查询参数
export interface InboundRecordQueryParams {
  page?: number;
  pageSize?: number;
  sku?: string;
  supplierId?: number;
  startDate?: string;
  endDate?: string;
}

// 出库记录查询参数
export interface OutboundRecordQueryParams {
  page?: number;
  pageSize?: number;
  sku?: string;
  startDate?: string;
  endDate?: string;
}

// 单个入库参数
export interface InboundParams {
  sku: string;
  quantity: number;
  supplierId: number;
  remark?: string;
}

// 批量入库项
export interface BatchInboundItem {
  sku: string;
  quantity: number;
  supplierId: number;
  remark?: string;
}

// 批量入库参数
export interface BatchInboundParams {
  items: BatchInboundItem[];
}

// 出库参数
export interface OutboundParams {
  sku: string;
  quantity: number;
  remark?: string;
}

// 库存服务
export const inventoryService = {
  /**
   * 单个商品入库
   */
  async inbound(data: InboundParams): Promise<ApiResponse<InboundRecord>> {
    return apiService.post<InboundRecord>('/inventory/inbound', data);
  },

  /**
   * 批量入库
   */
  async batchInbound(data: BatchInboundParams): Promise<ApiResponse<InboundRecord[]>> {
    return apiService.post<InboundRecord[]>('/inventory/inbound/batch', data);
  },

  /**
   * 获取入库记录列表
   */
  async getInboundRecords(params: InboundRecordQueryParams = {}): Promise<ApiResponse<PaginatedResponse<InboundRecord>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.sku) queryParams.sku = params.sku;
    if (params.supplierId) queryParams.supplierId = params.supplierId;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    return apiService.get<PaginatedResponse<InboundRecord>>('/inventory/inbound/records', queryParams);
  },

  /**
   * 商品出库
   */
  async outbound(data: OutboundParams): Promise<ApiResponse<OutboundRecord>> {
    return apiService.post<OutboundRecord>('/inventory/outbound', data);
  },

  /**
   * 获取出库记录列表
   */
  async getOutboundRecords(params: OutboundRecordQueryParams = {}): Promise<ApiResponse<PaginatedResponse<OutboundRecord>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.sku) queryParams.sku = params.sku;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    
    return apiService.get<PaginatedResponse<OutboundRecord>>('/inventory/outbound/records', queryParams);
  },
};

export default inventoryService;
