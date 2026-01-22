/**
 * Axios 实例配置
 * 包含请求/响应拦截器
 */
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// 创建 Axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 JWT Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      // 清除本地存储的 token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 重定向到登录页
        window.location.href = '/login';
      }
    }
    
    // 提取错误信息
    const errorMessage = extractErrorMessage(error);
    
    return Promise.reject(new Error(errorMessage));
  }
);

// 提取错误信息
function extractErrorMessage(error: AxiosError): string {
  if (error.response?.data) {
    const data = error.response.data as { message?: string };
    if (data.message) {
      return data.message;
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return '请求失败，请稍后重试';
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 分页参数类型
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 通用 API 方法
export const apiService = {
  // GET 请求
  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(url, { params });
    return response.data;
  },
  
  // POST 请求
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data);
    return response.data;
  },
  
  // PUT 请求
  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data);
    return response.data;
  },
  
  // DELETE 请求
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(url);
    return response.data;
  },
  
  // 下载文件
  async download(url: string, filename: string): Promise<void> {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    // 创建下载链接
    const blob = new Blob([response.data]);
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

export default api;
