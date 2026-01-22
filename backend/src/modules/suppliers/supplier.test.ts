/**
 * 供应商模块单元测试
 * 测试供应商服务的功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupplierService } from './supplier.service';

// Mock Prisma Client
const mockPrismaSupplier = {
  findFirst: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
};

const mockPrismaInventoryTransaction = {
  count: vi.fn(),
};

const mockPrisma = {
  supplier: mockPrismaSupplier,
  inventoryTransaction: mockPrismaInventoryTransaction,
} as unknown as import('@prisma/client').PrismaClient;

describe('SupplierService', () => {
  let supplierService: SupplierService;

  beforeEach(() => {
    supplierService = new SupplierService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('findAll', () => {
    it('应该返回分页的供应商列表', async () => {
      const mockSuppliers = [
        {
          id: 1,
          code: 'SUP001',
          name: '供应商A',
          contact: '张三',
          phone: '13800138000',
          address: '北京市朝阳区',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 2,
          code: 'SUP002',
          name: '供应商B',
          contact: '李四',
          phone: '13900139000',
          address: '上海市浦东新区',
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      mockPrismaSupplier.findMany.mockResolvedValue(mockSuppliers);
      mockPrismaSupplier.count.mockResolvedValue(2);

      const result = await supplierService.findAll({ page: 1, pageSize: 10 });

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(result.list[0].code).toBe('SUP001');
      expect(result.list[1].code).toBe('SUP002');
    });

    it('应该支持关键字搜索（名称）', async () => {
      mockPrismaSupplier.findMany.mockResolvedValue([]);
      mockPrismaSupplier.count.mockResolvedValue(0);

      await supplierService.findAll({ keyword: '供应商A' });

      expect(mockPrismaSupplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: '供应商A' } },
              { code: { contains: '供应商A' } },
            ],
          }),
        })
      );
    });

    it('应该支持关键字搜索（编码）', async () => {
      mockPrismaSupplier.findMany.mockResolvedValue([]);
      mockPrismaSupplier.count.mockResolvedValue(0);

      await supplierService.findAll({ keyword: 'SUP001' });

      expect(mockPrismaSupplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'SUP001' } },
              { code: { contains: 'SUP001' } },
            ],
          }),
        })
      );
    });

    it('应该使用默认分页参数', async () => {
      mockPrismaSupplier.findMany.mockResolvedValue([]);
      mockPrismaSupplier.count.mockResolvedValue(0);

      const result = await supplierService.findAll({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('findById', () => {
    it('应该返回指定供应商', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '供应商A',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);

      const result = await supplierService.findById(1);

      expect(result.id).toBe(1);
      expect(result.code).toBe('SUP001');
      expect(result.name).toBe('供应商A');
    });

    it('应该在供应商不存在时抛出错误', async () => {
      mockPrismaSupplier.findFirst.mockResolvedValue(null);

      await expect(supplierService.findById(999)).rejects.toThrow('供应商不存在');
    });
  });

  describe('create', () => {
    it('应该成功创建供应商', async () => {
      const mockCreatedSupplier = {
        id: 1,
        code: 'SUP001',
        name: '新供应商',
        contact: '王五',
        phone: '13700137000',
        address: '广州市天河区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(null); // 编码不存在
      mockPrismaSupplier.create.mockResolvedValue(mockCreatedSupplier);

      const result = await supplierService.create({
        code: 'SUP001',
        name: '新供应商',
        contact: '王五',
        phone: '13700137000',
        address: '广州市天河区',
      });

      expect(result.code).toBe('SUP001');
      expect(result.name).toBe('新供应商');
      expect(result.contact).toBe('王五');
    });

    it('应该在供应商编码已存在时抛出错误', async () => {
      const existingSupplier = {
        id: 1,
        code: 'SUP001',
        name: '已存在的供应商',
        contact: null,
        phone: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(existingSupplier);

      await expect(
        supplierService.create({
          code: 'SUP001',
          name: '新供应商',
        })
      ).rejects.toThrow('供应商编码已存在');
    });

    it('应该允许创建只有必填字段的供应商', async () => {
      const mockCreatedSupplier = {
        id: 1,
        code: 'SUP002',
        name: '简单供应商',
        contact: null,
        phone: null,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(null);
      mockPrismaSupplier.create.mockResolvedValue(mockCreatedSupplier);

      const result = await supplierService.create({
        code: 'SUP002',
        name: '简单供应商',
      });

      expect(result.code).toBe('SUP002');
      expect(result.name).toBe('简单供应商');
      expect(result.contact).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.address).toBeNull();
    });
  });

  describe('update', () => {
    it('应该成功更新供应商名称', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '旧名称',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaSupplier.update.mockResolvedValue({ ...mockSupplier, name: '新名称' });

      const result = await supplierService.update(1, { name: '新名称' });

      expect(result.name).toBe('新名称');
    });

    it('应该成功更新供应商联系信息', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '供应商A',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedSupplier = {
        ...mockSupplier,
        contact: '李四',
        phone: '13900139000',
        address: '上海市浦东新区',
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaSupplier.update.mockResolvedValue(updatedSupplier);

      const result = await supplierService.update(1, {
        contact: '李四',
        phone: '13900139000',
        address: '上海市浦东新区',
      });

      expect(result.contact).toBe('李四');
      expect(result.phone).toBe('13900139000');
      expect(result.address).toBe('上海市浦东新区');
    });

    it('应该允许将可选字段设为 null', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '供应商A',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedSupplier = {
        ...mockSupplier,
        contact: null,
        phone: null,
        address: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaSupplier.update.mockResolvedValue(updatedSupplier);

      const result = await supplierService.update(1, {
        contact: null,
        phone: null,
        address: null,
      });

      expect(result.contact).toBeNull();
      expect(result.phone).toBeNull();
      expect(result.address).toBeNull();
    });

    it('应该在供应商不存在时抛出错误', async () => {
      mockPrismaSupplier.findFirst.mockResolvedValue(null);

      await expect(supplierService.update(999, { name: '新名称' })).rejects.toThrow('供应商不存在');
    });
  });

  describe('delete', () => {
    it('应该成功软删除供应商', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '供应商A',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaInventoryTransaction.count.mockResolvedValue(0); // 无关联入库记录
      mockPrismaSupplier.update.mockResolvedValue({ ...mockSupplier, deletedAt: new Date() });

      await expect(supplierService.delete(1)).resolves.not.toThrow();

      expect(mockPrismaSupplier.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('应该在供应商不存在时抛出错误', async () => {
      mockPrismaSupplier.findFirst.mockResolvedValue(null);

      await expect(supplierService.delete(999)).rejects.toThrow('供应商不存在');
    });

    it('应该在供应商有关联入库记录时阻止删除', async () => {
      const mockSupplier = {
        id: 1,
        code: 'SUP001',
        name: '供应商A',
        contact: '张三',
        phone: '13800138000',
        address: '北京市朝阳区',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockPrismaSupplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaInventoryTransaction.count.mockResolvedValue(5); // 有5条关联入库记录

      await expect(supplierService.delete(1)).rejects.toThrow('该供应商有关联的入库记录，无法删除');
    });
  });
});
