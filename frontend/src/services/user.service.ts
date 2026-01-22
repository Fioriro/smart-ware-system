/**
 * 用户管理 API 服务
 * 提供用户 CRUD 操作
 */
import { apiService, ApiResponse, PaginatedResponse } from './api';

// 用户状态枚举
export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// 用户类型定义
export interface User {
  id: number;
  username: string;
  role: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

// 用户查询参数
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
}

// 创建用户参数
export interface CreateUserParams {
  username: string;
  password: string;
  role?: string;
  status?: number;
}

// 更新用户参数
export interface UpdateUserParams {
  role?: string;
  status?: number;
  password?: string;
}

// 用户服务
export const userService = {
  /**
   * 获取用户列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async getUsers(params: UserQueryParams = {}): Promise<ApiResponse<PaginatedResponse<User>>> {
    const queryParams: Record<string, unknown> = {};
    
    if (params.page) queryParams.page = params.page;
    if (params.pageSize) queryParams.pageSize = params.pageSize;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.status !== undefined) queryParams.status = params.status;
    
    return apiService.get<PaginatedResponse<User>>('/users', queryParams);
  },

  /**
   * 获取用户详情
   * @param id 用户ID
   * @returns 用户信息
   */
  async getUser(id: number): Promise<ApiResponse<User>> {
    return apiService.get<User>(`/users/${id}`);
  },

  /**
   * 创建用户
   * @param data 创建参数
   * @returns 创建的用户
   */
  async createUser(data: CreateUserParams): Promise<ApiResponse<User>> {
    return apiService.post<User>('/users', data);
  },

  /**
   * 更新用户
   * @param id 用户ID
   * @param data 更新参数
   * @returns 更新后的用户
   */
  async updateUser(id: number, data: UpdateUserParams): Promise<ApiResponse<User>> {
    return apiService.put<User>(`/users/${id}`, data);
  },

  /**
   * 删除用户（软删除）
   * @param id 用户ID
   */
  async deleteUser(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/users/${id}`);
  },

  /**
   * 切换用户状态（启用/禁用）
   * @param id 用户ID
   * @param status 新状态
   * @returns 更新后的用户
   */
  async toggleUserStatus(id: number, status: UserStatus): Promise<ApiResponse<User>> {
    return apiService.put<User>(`/users/${id}`, { status });
  },
};

/**
 * 获取用户状态标签
 * @param status 状态值
 * @returns 中文标签
 */
export function getUserStatusLabel(status: number): string {
  switch (status) {
    case UserStatus.ENABLED:
      return '启用';
    case UserStatus.DISABLED:
      return '禁用';
    default:
      return '未知';
  }
}

/**
 * 获取用户角色标签
 * @param role 角色值
 * @returns 中文标签
 */
export function getUserRoleLabel(role: string): string {
  switch (role) {
    case UserRole.ADMIN:
      return '管理员';
    case UserRole.USER:
      return '普通用户';
    default:
      return role;
  }
}

export default userService;
