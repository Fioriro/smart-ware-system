/**
 * 审计日志 API 服务
 * 提供审计日志查询和导出功能
 */
import { apiService, ApiResponse, PaginatedResponse } from './api';
import api from './api';

// 操作类型
export type OperationType = 'IN' | 'OUT';

// 审计日志记录类型定义
export interface AuditLog {
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
}

// 审计日志查询参数
export interface AuditLogQueryParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  operationType?: OperationType;
  keyword?: string;
}

// 审计日志导出参数
export interface AuditLogExportParams {
  startDate?: string;
  endDate?: string;
  operationType?: OperationType;
  keyword?: string;
}

// 审计日志服务
export const logService = {
  /**
   * 获取审计日志列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async getLogs(params: AuditLogQueryParams = {}): Promise<ApiResponse<PaginatedResponse<AuditLog>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;
    if (params.operationType) queryParams.operationType = params.operationType;
    if (params.keyword) queryParams.keyword = params.keyword;
    
    return apiService.get<PaginatedResponse<AuditLog>>('/logs', queryParams);
  },

  /**
   * 导出审计日志为 Excel 文件
   * @param params 导出参数
   */
  async exportLogs(params: AuditLogExportParams = {}): Promise<void> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.set('startDate', params.startDate);
    if (params.endDate) queryParams.set('endDate', params.endDate);
    if (params.operationType) queryParams.set('operationType', params.operationType);
    if (params.keyword) queryParams.set('keyword', params.keyword);
    
    const queryString = queryParams.toString();
    const url = `/logs/export${queryString ? `?${queryString}` : ''}`;
    
    // 发起下载请求
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // 从响应头获取文件名，如果没有则生成默认文件名
    const contentDisposition = response.headers['content-disposition'];
    let filename = generateExportFilename();
    
    if (contentDisposition) {
      // 尝试从 Content-Disposition 头解析文件名
      const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^;\r\n"']*)['"]?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = decodeURIComponent(filenameMatch[1]);
      }
    }
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};

/**
 * 生成导出文件名
 * 格式：审计日志_YYYYMMDD_HHMMSS.xlsx
 */
function generateExportFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `审计日志_${year}${month}${day}_${hours}${minutes}${seconds}.xlsx`;
}

/**
 * 获取操作类型中文标签
 * @param type 操作类型
 * @returns 中文标签
 */
export function getOperationTypeLabel(type: OperationType): string {
  switch (type) {
    case 'IN':
      return '入库';
    case 'OUT':
      return '出库';
    default:
      return '未知';
  }
}

export default logService;
