/**
 * 用户控制器
 * 处理用户相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { UserService } from './user.service';
import { ResponseUtil } from '../../shared/utils/response';
import {
  LoginDTO,
  CreateUserDTO,
  UpdateUserDTO,
  ResetPasswordDTO,
  UserQueryParams,
} from './user.model';

/**
 * 用户控制器类
 */
export class UserController {
  constructor(private userService: UserService) {}

  /**
   * 用户登录
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginDTO: LoginDTO = req.body;

      // 验证必填字段
      if (!loginDTO.username || !loginDTO.password) {
        ResponseUtil.error(res, '用户名和密码不能为空');
        return;
      }

      const result = await this.userService.login(loginDTO);
      ResponseUtil.success(res, result, '登录成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 用户登出
   * POST /api/v1/auth/logout
   */
  logout = async (_req: Request, res: Response): Promise<void> => {
    // JWT 是无状态的，登出只需要前端清除 Token
    // 后端可以选择将 Token 加入黑名单（本 MVP 版本不实现）
    ResponseUtil.success(res, null, '登出成功');
  };

  /**
   * 获取当前用户信息
   * GET /api/v1/auth/me
   */
  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, '请先登录');
        return;
      }

      const user = await this.userService.getCurrentUser(userId);
      ResponseUtil.success(res, user, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户信息失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 重置密码
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const resetDTO: ResetPasswordDTO = req.body;

      // 验证必填字段
      if (!resetDTO.username || !resetDTO.newPassword) {
        ResponseUtil.error(res, '用户名和新密码不能为空');
        return;
      }

      // 验证密码长度
      if (resetDTO.newPassword.length < 6) {
        ResponseUtil.error(res, '密码长度不能少于6位');
        return;
      }

      await this.userService.resetPassword(resetDTO);
      ResponseUtil.success(res, null, '密码重置成功，请使用新密码登录');
    } catch (error) {
      const message = error instanceof Error ? error.message : '密码重置失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 获取用户列表
   * GET /api/v1/users
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: UserQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        keyword: req.query.keyword as string | undefined,
        status: req.query.status !== undefined ? parseInt(req.query.status as string, 10) : undefined,
      };

      const result = await this.userService.findAll(params);
      ResponseUtil.paginated(
        res,
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取成功'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户列表失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 获取用户详情
   * GET /api/v1/users/:id
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的用户 ID');
        return;
      }

      const user = await this.userService.findById(id);
      ResponseUtil.success(res, user, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取用户详情失败';
      if (message === '用户不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 创建用户
   * POST /api/v1/users
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const createDTO: CreateUserDTO = req.body;

      // 验证必填字段
      if (!createDTO.username || !createDTO.password) {
        ResponseUtil.error(res, '用户名和密码不能为空');
        return;
      }

      // 验证用户名长度
      if (createDTO.username.length < 3 || createDTO.username.length > 50) {
        ResponseUtil.error(res, '用户名长度应在3-50个字符之间');
        return;
      }

      // 验证密码长度
      if (createDTO.password.length < 6) {
        ResponseUtil.error(res, '密码长度不能少于6位');
        return;
      }

      const user = await this.userService.create(createDTO);
      ResponseUtil.created(res, user, '创建成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建用户失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 更新用户
   * PUT /api/v1/users/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的用户 ID');
        return;
      }

      const updateDTO: UpdateUserDTO = req.body;

      // 验证密码长度（如果提供了密码）
      if (updateDTO.password && updateDTO.password.length < 6) {
        ResponseUtil.error(res, '密码长度不能少于6位');
        return;
      }

      // 验证状态值
      if (updateDTO.status !== undefined && ![0, 1].includes(updateDTO.status)) {
        ResponseUtil.error(res, '无效的状态值，应为 0（禁用）或 1（启用）');
        return;
      }

      const user = await this.userService.update(id, updateDTO);
      ResponseUtil.success(res, user, '更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新用户失败';
      if (message === '用户不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 删除用户（软删除）
   * DELETE /api/v1/users/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的用户 ID');
        return;
      }

      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        ResponseUtil.unauthorized(res, '请先登录');
        return;
      }

      await this.userService.delete(id, currentUserId);
      ResponseUtil.success(res, null, '删除成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除用户失败';
      if (message === '用户不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };
}

export default UserController;
