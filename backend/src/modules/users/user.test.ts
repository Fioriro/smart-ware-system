/**
 * 用户模块单元测试
 * 测试用户服务和控制器的功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { UserStatus } from './user.model';

// Mock Prisma Client
const mockPrismaUser = {
  findFirst: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockPrisma = {
  user: mockPrismaUser,
} as unknown as import('@prisma/client').PrismaClient;

// Mock JWT 生成函数
vi.mock('../../shared/middleware/auth.middleware', () => ({
  generateToken: vi.fn(() => 'mock-jwt-token'),
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('应该成功登录并返回 token 和用户信息', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await userService.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.username).toBe('testuser');
      expect(result.user).not.toHaveProperty('password');
    });

    it('应该在用户名不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(
        userService.login({
          username: 'nonexistent',
          password: 'password123',
        })
      ).rejects.toThrow('用户名或密码错误');
    });

    it('应该在密码错误时抛出错误', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      await expect(
        userService.login({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('用户名或密码错误');
    });

    it('应该在用户被禁用时抛出错误', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword,
        role: 'admin',
        status: UserStatus.DISABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      await expect(
        userService.login({
          username: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow('账户已被禁用，请联系管理员');
    });
  });

  describe('getCurrentUser', () => {
    it('应该返回当前用户信息', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await userService.getCurrentUser(1);

      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
      expect(result).not.toHaveProperty('password');
    });

    it('应该在用户不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(userService.getCurrentUser(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('resetPassword', () => {
    it('应该成功重置密码', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'oldhashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, password: 'newhashedpassword' });

      await expect(
        userService.resetPassword({
          username: 'testuser',
          newPassword: 'newpassword123',
        })
      ).resolves.not.toThrow();

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: expect.any(String) },
      });
    });

    it('应该在用户不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(
        userService.resetPassword({
          username: 'nonexistent',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow('用户不存在');
    });
  });

  describe('findAll', () => {
    it('应该返回分页的用户列表', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          password: 'hash1',
          role: 'admin',
          status: UserStatus.ENABLED,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          username: 'user2',
          password: 'hash2',
          role: 'user',
          status: UserStatus.ENABLED,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaUser.findMany.mockResolvedValue(mockUsers);
      mockPrismaUser.count.mockResolvedValue(2);

      const result = await userService.findAll({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.list[0]).not.toHaveProperty('password');
    });

    it('应该支持关键字搜索', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockResolvedValue(0);

      await userService.findAll({ keyword: 'test' });

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            username: { contains: 'test' },
          }),
        })
      );
    });

    it('应该支持状态筛选', async () => {
      mockPrismaUser.findMany.mockResolvedValue([]);
      mockPrismaUser.count.mockResolvedValue(0);

      await userService.findAll({ status: UserStatus.ENABLED });

      expect(mockPrismaUser.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: UserStatus.ENABLED,
          }),
        })
      );
    });
  });

  describe('findById', () => {
    it('应该返回指定用户', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);

      const result = await userService.findById(1);

      expect(result.id).toBe(1);
      expect(result.username).toBe('testuser');
    });

    it('应该在用户不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(userService.findById(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('create', () => {
    it('应该成功创建用户', async () => {
      const mockCreatedUser = {
        id: 1,
        username: 'newuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(null); // 用户名不存在
      mockPrismaUser.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.create({
        username: 'newuser',
        password: 'password123',
      });

      expect(result.username).toBe('newuser');
      expect(result).not.toHaveProperty('password');
    });

    it('应该在用户名已存在时抛出错误', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(existingUser);

      await expect(
        userService.create({
          username: 'existinguser',
          password: 'password123',
        })
      ).rejects.toThrow('用户名已存在');
    });
  });

  describe('update', () => {
    it('应该成功更新用户角色', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, role: 'user' });

      const result = await userService.update(1, { role: 'user' });

      expect(result.role).toBe('user');
    });

    it('应该成功更新用户状态', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, status: UserStatus.DISABLED });

      const result = await userService.update(1, { status: UserStatus.DISABLED });

      expect(result.status).toBe(UserStatus.DISABLED);
    });

    it('应该在用户不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(userService.update(999, { role: 'user' })).rejects.toThrow('用户不存在');
    });
  });

  describe('delete', () => {
    it('应该成功软删除用户', async () => {
      const mockUser = {
        id: 2,
        username: 'testuser',
        password: 'hashedpassword',
        role: 'admin',
        status: UserStatus.ENABLED,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockPrismaUser.update.mockResolvedValue({ ...mockUser, deletedAt: new Date() });

      await expect(userService.delete(2, 1)).resolves.not.toThrow();

      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('应该阻止删除当前登录用户', async () => {
      await expect(userService.delete(1, 1)).rejects.toThrow('不能删除当前登录的用户');
    });

    it('应该在用户不存在时抛出错误', async () => {
      mockPrismaUser.findFirst.mockResolvedValue(null);

      await expect(userService.delete(999, 1)).rejects.toThrow('用户不存在');
    });
  });
});
