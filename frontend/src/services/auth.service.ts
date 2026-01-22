/**
 * 认证服务
 * 处理登录、登出、获取用户信息等认证相关 API 调用
 */
import { apiService, ApiResponse } from './api';

// 用户信息类型
export interface User {
  id: number;
  username: string;
  role: string;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应数据
export interface LoginResponse {
  token: string;
  user: User;
}

// 认证服务
export const authService = {
  /**
   * 用户登录
   * @param credentials 登录凭据（用户名、密码）
   * @returns 登录响应（token 和用户信息）
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiService.post<LoginResponse>('/auth/login', credentials);
  },

  /**
   * 用户登出
   * @returns 登出响应
   */
  async logout(): Promise<ApiResponse<null>> {
    return apiService.post<null>('/auth/logout');
  },

  /**
   * 获取当前用户信息
   * @returns 当前用户信息
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiService.get<User>('/auth/me');
  },

  /**
   * 重置密码
   * @param username 用户名
   * @param newPassword 新密码
   * @returns 重置响应
   */
  async resetPassword(username: string, newPassword: string): Promise<ApiResponse<null>> {
    return apiService.post<null>('/auth/reset-password', { username, newPassword });
  },
};

export default authService;
