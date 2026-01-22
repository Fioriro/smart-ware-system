/**
 * 用户模型
 * 定义用户相关的类型和接口
 */

/**
 * 用户状态枚举
 */
export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

/**
 * 用户实体接口
 */
export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * 用户响应 DTO（不包含密码）
 */
export interface UserDTO {
  id: number;
  username: string;
  role: string;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建用户请求 DTO
 */
export interface CreateUserDTO {
  username: string;
  password: string;
  role?: string;
  status?: number;
}

/**
 * 更新用户请求 DTO
 */
export interface UpdateUserDTO {
  role?: string;
  status?: number;
  password?: string;
}

/**
 * 用户登录请求 DTO
 */
export interface LoginDTO {
  username: string;
  password: string;
}

/**
 * 用户登录响应 DTO
 */
export interface LoginResponseDTO {
  token: string;
  user: UserDTO;
}

/**
 * 密码重置请求 DTO
 */
export interface ResetPasswordDTO {
  username: string;
  newPassword: string;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
}

/**
 * 将用户实体转换为 DTO（移除敏感信息）
 * @param user 用户实体
 * @returns 用户 DTO
 */
export const toUserDTO = (user: User): UserDTO => {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export default {
  UserStatus,
  UserRole,
  toUserDTO,
};
