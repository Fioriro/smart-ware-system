/**
 * 商品分类模块单元测试
 * 测试分类服务的功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from './category.service';

// 创建 Mock Prisma Client
function createMockPrisma() {
  return {
    category: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    product: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  };
}

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = createMockPrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categoryService = new CategoryService(mockPrisma as any);
  });

  describe('getCategoryTree - 分类树构建测试', () => {
    it('应该返回空数组当没有分类时', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      mockPrisma.product.groupBy.mockResolvedValue([]);

      const result = await categoryService.getCategoryTree();

      expect(result).toEqual([]);
    });

    it('应该正确构建单层分类树并包含商品数量', async () => {
      const now = new Date();
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 1, name: '电子产品', parentId: null, createdAt: now, updatedAt: now, deletedAt: null },
        { id: 2, name: '服装', parentId: null, createdAt: now, updatedAt: now, deletedAt: null },
      ]);
      mockPrisma.product.groupBy.mockResolvedValue([
        { categoryId: 1, _count: { id: 5 } },
        { categoryId: 2, _count: { id: 3 } },
      ]);

      const result = await categoryService.getCategoryTree();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('电子产品');
      expect(result[0].productCount).toBe(5);
      expect(result[0].children).toEqual([]);
      expect(result[1].name).toBe('服装');
      expect(result[1].productCount).toBe(3);
    });

    it('应该正确构建多层嵌套分类树', async () => {
      const now = new Date();
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 1, name: '电子产品', parentId: null, createdAt: now, updatedAt: now, deletedAt: null },
        { id: 2, name: '手机', parentId: 1, createdAt: now, updatedAt: now, deletedAt: null },
        { id: 3, name: '电脑', parentId: 1, createdAt: now, updatedAt: now, deletedAt: null },
      ]);
      mockPrisma.product.groupBy.mockResolvedValue([
        { categoryId: 2, _count: { id: 10 } },
      ]);

      const result = await categoryService.getCategoryTree();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('电子产品');
      expect(result[0].children).toHaveLength(2);
      const phoneCategory = result[0].children.find(c => c.name === '手机');
      expect(phoneCategory?.productCount).toBe(10);
    });
  });

  describe('findById - 分类详情查询', () => {
    it('应该返回指定分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '电子产品', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });

      const result = await categoryService.findById(1);

      expect(result.id).toBe(1);
      expect(result.name).toBe('电子产品');
    });

    it('应该在分类不存在时抛出错误', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(categoryService.findById(999)).rejects.toThrow('分类不存在');
    });
  });

  describe('create - 创建分类', () => {
    it('应该成功创建顶级分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 1, name: '新分类', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });

      const result = await categoryService.create({ name: '新分类' });

      expect(result.name).toBe('新分类');
      expect(result.parentId).toBeNull();
    });

    it('应该成功创建子分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst
        .mockResolvedValueOnce({ id: 1, name: '父分类', parentId: null, createdAt: now, updatedAt: now, deletedAt: null })
        .mockResolvedValueOnce(null);
      mockPrisma.category.create.mockResolvedValue({
        id: 2, name: '子分类', parentId: 1, createdAt: now, updatedAt: now, deletedAt: null
      });

      const result = await categoryService.create({ name: '子分类', parentId: 1 });

      expect(result.name).toBe('子分类');
      expect(result.parentId).toBe(1);
    });

    it('应该在父分类不存在时抛出错误', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(categoryService.create({ name: '子分类', parentId: 999 })).rejects.toThrow('父分类不存在');
    });

    it('应该在同级分类名称重复时抛出错误', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '已存在', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });

      await expect(categoryService.create({ name: '已存在' })).rejects.toThrow('同级分类名称已存在');
    });
  });

  describe('update - 更新分类', () => {
    it('应该成功更新分类名称', async () => {
      const now = new Date();
      mockPrisma.category.findFirst
        .mockResolvedValueOnce({ id: 1, name: '旧名称', parentId: null, createdAt: now, updatedAt: now, deletedAt: null })
        .mockResolvedValueOnce(null);
      mockPrisma.category.update.mockResolvedValue({
        id: 1, name: '新名称', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });

      const result = await categoryService.update(1, { name: '新名称' });

      expect(result.name).toBe('新名称');
    });

    it('应该在分类不存在时抛出错误', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(categoryService.update(999, { name: '新名称' })).rejects.toThrow('分类不存在');
    });

    it('应该阻止将分类设为自己的子分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '分类', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });

      await expect(categoryService.update(1, { parentId: 1 })).rejects.toThrow('不能将分类设为自己的子分类');
    });

    it('应该阻止将分类设为其子分类的子分类（循环引用）', async () => {
      const now = new Date();
      mockPrisma.category.findFirst
        .mockResolvedValueOnce({ id: 1, name: '父分类', parentId: null, createdAt: now, updatedAt: now, deletedAt: null })
        .mockResolvedValueOnce({ id: 2, name: '子分类', parentId: 1, createdAt: now, updatedAt: now, deletedAt: null });
      mockPrisma.category.findMany.mockResolvedValue([{ id: 2 }]);

      await expect(categoryService.update(1, { parentId: 2 })).rejects.toThrow('不能将分类设为其子分类的子分类');
    });
  });

  describe('delete - 删除分类', () => {
    it('应该成功软删除分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '待删除', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.category.update.mockResolvedValue({});

      await expect(categoryService.delete(1)).resolves.not.toThrow();
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('应该在分类不存在时抛出错误', async () => {
      mockPrisma.category.findFirst.mockResolvedValue(null);

      await expect(categoryService.delete(999)).rejects.toThrow('分类不存在');
    });

    it('应该阻止删除有子分类的分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '父分类', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });
      mockPrisma.category.count.mockResolvedValue(2);

      await expect(categoryService.delete(1)).rejects.toThrow('该分类下有子分类，请先删除子分类');
    });

    it('应该阻止删除有关联商品的分类', async () => {
      const now = new Date();
      mockPrisma.category.findFirst.mockResolvedValue({
        id: 1, name: '有商品', parentId: null, createdAt: now, updatedAt: now, deletedAt: null
      });
      mockPrisma.category.count.mockResolvedValue(0);
      mockPrisma.product.count.mockResolvedValue(5);

      await expect(categoryService.delete(1)).rejects.toThrow('该分类下有关联商品，请先移除商品关联');
    });
  });
});
