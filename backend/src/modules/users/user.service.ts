/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  User,
  UserDTO,
  CreateUserDTO,
  UpdateUserDTO,
  LoginDTO,
  LoginResponseDTO,
  ResetPasswordDTO,
  UserQueryParams,
  toUserDTO,
  UserStatus,
} from './user.model';
import { generateToken } from '../../shared/middleware/auth.middleware';
import { PaginationUtil, PaginationResult } from '../../shared/utils/pagination';

/**
 * 密码加密盐轮数
 */
const SALT_ROUNDS = 10;

/**
 * 用户服务类
 */
export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 用户登录
   * @param loginDTO 登录信息
   * @returns 登录响应（包含 token 和用户信息）
   */
  async login(loginDTO: LoginDTO): Promise<LoginResponseDTO> {
    const { username, password } = loginDTO;

    // 查找用户（排除已删除的用户）
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status === UserStatus.DISABLED) {
      throw new Error('账户已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: toUserDTO(user as User),
    };
  }

  /**
   * 获取当前用户信息
   * @param userId 用户 ID
   * @returns 用户 DTO
   */
  async getCurrentUser(userId: number): Promise<UserDTO> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return toUserDTO(user as User);
  }

  /**
   * 重置密码
   * @param resetDTO 重置密码信息
   */
  async resetPassword(resetDTO: ResetPasswordDTO): Promise<void> {
    const { username, newPassword } = resetDTO;

    // 查找用户
    const user = await this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // 更新密码
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
  }

  /**
   * 获取用户列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async findAll(params: UserQueryParams): Promise<PaginationResult<UserDTO>> {
    const paginationParams = PaginationUtil.parseParams(params.page, params.pageSize);
    const { skip, take } = PaginationUtil.toQuery(paginationParams);

    // 构建查询条件
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // 关键字搜索（用户名）
    if (params.keyword) {
      where.username = {
        contains: params.keyword,
      };
    }

    // 状态筛选
    if (params.status !== undefined) {
      where.status = params.status;
    }

    // 查询用户列表和总数
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // 转换为 DTO
    const userDTOs = users.map((user) => toUserDTO(user as User));

    return PaginationUtil.createResult(userDTOs, total, paginationParams);
  }

  /**
   * 获取用户详情
   * @param id 用户 ID
   * @returns 用户 DTO
   */
  async findById(id: number): Promise<UserDTO> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return toUserDTO(user as User);
  }

  /**
   * 创建用户
   * @param createDTO 创建用户信息
   * @returns 用户 DTO
   */
  async create(createDTO: CreateUserDTO): Promise<UserDTO> {
    const { username, password, role = 'admin', status = UserStatus.ENABLED } = createDTO;

    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        status,
      },
    });

    return toUserDTO(user as User);
  }

  /**
   * 更新用户
   * @param id 用户 ID
   * @param updateDTO 更新信息
   * @returns 用户 DTO
   */
  async update(id: number, updateDTO: UpdateUserDTO): Promise<UserDTO> {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};

    if (updateDTO.role !== undefined) {
      updateData.role = updateDTO.role;
    }

    if (updateDTO.status !== undefined) {
      updateData.status = updateDTO.status;
    }

    if (updateDTO.password) {
      updateData.password = await bcrypt.hash(updateDTO.password, SALT_ROUNDS);
    }

    // 更新用户
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    return toUserDTO(user as User);
  }

  /**
   * 删除用户（软删除）
   * @param id 用户 ID
   * @param currentUserId 当前登录用户 ID
   */
  async delete(id: number, currentUserId: number): Promise<void> {
    // 不能删除自己
    if (id === currentUserId) {
      throw new Error('不能删除当前登录的用户');
    }

    // 检查用户是否存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new Error('用户不存在');
    }

    // 软删除用户
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default UserService;
