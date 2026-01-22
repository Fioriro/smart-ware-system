/**
 * 集成测试环境配置
 * 提供测试数据库连接、测试用户创建、Token 生成等工具
 */

import { PrismaClient } from '@prisma/client';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { expect } from 'vitest';
import { createApp } from '../../app';

// 测试用 Prisma 客户端
let testPrisma: PrismaClient | null = null;

/**
 * 获取测试用 Prisma 客户端
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return testPrisma;
}

/**
 * 关闭测试用 Prisma 客户端
 */
export async function closeTestPrisma(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * 创建测试应用实例
 */
export function createTestApp() {
  return createApp();
}

/**
 * 测试用户数据
 */
export interface TestUser {
  id: number;
  username: string;
  password: string;
  role: string;
  status: number;
}

/**
 * 创建测试用户
 */
export async function createTestUser(
  username: string,
  password: string = 'test123456',
  role: string = 'admin'
): Promise<TestUser> {
  const prisma = getTestPrisma();
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role,
      status: 1,
      deletedAt: null,
    },
    create: {
      username,
      password: hashedPassword,
      role,
      status: 1,
    },
  });

  return {
    id: user.id,
    username: user.username,
    password,
    role: user.role,
    status: user.status,
  };
}

/**
 * 生成测试用 JWT Token
 */
export function generateTestToken(user: TestUser, expiresIn: string = '1h'): string {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || 'test_secret',
    options
  );
}

/**
 * 生成过期的测试 Token
 */
export function generateExpiredToken(user: TestUser): string {
  // 生成一个已过期的 token（设置过期时间为1秒前）
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2小时前签发
    exp: Math.floor(Date.now() / 1000) - 3600, // 1小时前过期
  };
  return jwt.sign(payload, process.env.JWT_SECRET || 'test_secret');
}

/**
 * 清理测试数据
 * @param prefix 测试数据前缀
 */
export async function cleanupTestData(prefix: string): Promise<void> {
  const prisma = getTestPrisma();

  try {
    // 按照外键依赖顺序删除，不使用事务以避免超时
    await prisma.inventoryTransaction.deleteMany({
      where: { sku: { startsWith: prefix } },
    });

    await prisma.product.deleteMany({
      where: { sku: { startsWith: prefix } },
    });

    await prisma.supplier.deleteMany({
      where: { code: { startsWith: prefix } },
    });

    await prisma.category.deleteMany({
      where: { name: { startsWith: prefix } },
    });

    await prisma.user.deleteMany({
      where: { username: { startsWith: prefix } },
    });
  } catch (error) {
    // 清理失败时只记录警告，不抛出错误
    console.warn(`清理测试数据时出现警告 (prefix: ${prefix}):`, error);
  }
}

/**
 * 清理所有测试数据（谨慎使用）
 * 仅在测试环境中使用
 */
export async function cleanupAllTestData(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanupAllTestData 只能在测试环境中使用');
  }

  const prisma = getTestPrisma();

  // 按照外键依赖顺序删除
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.category.deleteMany({});
  // 保留默认管理员用户
  await prisma.user.deleteMany({
    where: { username: { not: 'admin' } },
  });
}

/**
 * 清理测试商品和交易记录
 * 用于 beforeEach 中快速清理，避免锁冲突
 * @param prefix 测试数据前缀
 */
export async function cleanupTestProductsAndTransactions(prefix: string): Promise<void> {
  const prisma = getTestPrisma();

  // 添加短暂延迟，确保之前的事务已完成
  await wait(100);

  try {
    // 先删除交易记录（无外键依赖）
    await prisma.inventoryTransaction.deleteMany({
      where: { sku: { startsWith: prefix } },
    });

    // 再删除商品
    await prisma.product.deleteMany({
      where: { sku: { startsWith: prefix } },
    });
  } catch (error) {
    // 如果出现锁超时，等待后重试一次
    console.warn('清理测试数据时出现锁冲突，等待后重试...');
    await wait(500);

    await prisma.inventoryTransaction.deleteMany({
      where: { sku: { startsWith: prefix } },
    });
    await prisma.product.deleteMany({
      where: { sku: { startsWith: prefix } },
    });
  }
}

/**
 * 创建测试分类
 */
export async function createTestCategory(
  name: string,
  parentId: number | null = null
): Promise<{ id: number; name: string; parentId: number | null }> {
  const prisma = getTestPrisma();

  const category = await prisma.category.create({
    data: { name, parentId },
  });

  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
  };
}

/**
 * 创建测试供应商
 */
export async function createTestSupplier(
  code: string,
  name: string,
  options?: { contact?: string; phone?: string; address?: string }
): Promise<{ id: number; code: string; name: string }> {
  const prisma = getTestPrisma();

  const supplier = await prisma.supplier.upsert({
    where: { code },
    update: {
      name,
      contact: options?.contact || '测试联系人',
      phone: options?.phone || '13800138000',
      address: options?.address || '测试地址',
      deletedAt: null,
    },
    create: {
      code,
      name,
      contact: options?.contact || '测试联系人',
      phone: options?.phone || '13800138000',
      address: options?.address || '测试地址',
    },
  });

  return {
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
  };
}

/**
 * 创建测试商品
 */
export async function createTestProduct(
  sku: string,
  name: string,
  categoryId: number,
  quantity: number = 100,
  options?: {
    minThreshold?: number;
    costPrice?: number;
    salePrice?: number;
    unit?: string;
  }
): Promise<{
  id: number;
  sku: string;
  name: string;
  categoryId: number;
  quantity: number;
  version: number;
  minThreshold: number;
}> {
  const prisma = getTestPrisma();

  const product = await prisma.product.create({
    data: {
      sku,
      name,
      categoryId,
      unit: options?.unit || '个',
      quantity,
      minThreshold: options?.minThreshold ?? 10,
      costPrice: options?.costPrice ?? 50.0,
      salePrice: options?.salePrice ?? 100.0,
    },
  });

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    categoryId: product.categoryId,
    quantity: product.quantity,
    version: product.version,
    minThreshold: product.minThreshold,
  };
}

/**
 * 创建测试库存交易记录
 */
export async function createTestTransaction(
  type: 'IN' | 'OUT' | 'ADJUSTMENT',
  productId: number,
  sku: string,
  quantity: number,
  operatorId: number,
  options?: {
    supplierId?: number | null;
    quantityBefore?: number;
    quantityAfter?: number;
    remark?: string;
  }
): Promise<{ id: number; type: string; quantity: number }> {
  const prisma = getTestPrisma();

  const transaction = await prisma.inventoryTransaction.create({
    data: {
      type,
      productId,
      sku,
      quantity,
      quantityBefore: options?.quantityBefore ?? 0,
      quantityAfter: options?.quantityAfter ?? quantity,
      supplierId: options?.supplierId ?? null,
      operatorId,
      remark: options?.remark ?? null,
    },
  });

  return {
    id: transaction.id,
    type: transaction.type,
    quantity: transaction.quantity,
  };
}

/**
 * 等待指定毫秒数
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成唯一的测试前缀
 * 用于避免并行测试时的数据冲突
 */
export function generateTestPrefix(baseName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}_${timestamp}_${random}_`;
}

/**
 * 测试数据构建器 - 用于创建复杂的测试场景
 */
export class TestDataBuilder {
  private prefix: string;
  private createdData: {
    users: TestUser[];
    categories: { id: number; name: string }[];
    suppliers: { id: number; code: string }[];
    products: { id: number; sku: string }[];
  };

  constructor(prefix: string) {
    this.prefix = prefix;
    this.createdData = {
      users: [],
      categories: [],
      suppliers: [],
      products: [],
    };
  }

  async withUser(
    username: string,
    password: string = 'test123456',
    role: string = 'admin'
  ): Promise<this> {
    const user = await createTestUser(`${this.prefix}${username}`, password, role);
    this.createdData.users.push(user);
    return this;
  }

  async withCategory(name: string, parentId: number | null = null): Promise<this> {
    const category = await createTestCategory(`${this.prefix}${name}`, parentId);
    this.createdData.categories.push(category);
    return this;
  }

  async withSupplier(code: string, name: string): Promise<this> {
    const supplier = await createTestSupplier(
      `${this.prefix}${code}`,
      `${this.prefix}${name}`
    );
    this.createdData.suppliers.push(supplier);
    return this;
  }

  async withProduct(
    sku: string,
    name: string,
    categoryIndex: number = 0,
    quantity: number = 100
  ): Promise<this> {
    const categoryId = this.createdData.categories[categoryIndex]?.id;
    if (!categoryId) {
      throw new Error('请先创建分类');
    }
    const product = await createTestProduct(
      `${this.prefix}${sku}`,
      `${this.prefix}${name}`,
      categoryId,
      quantity
    );
    this.createdData.products.push(product);
    return this;
  }

  getData() {
    return this.createdData;
  }

  async cleanup(): Promise<void> {
    await cleanupTestData(this.prefix);
  }
}

/**
 * 断言工具 - 验证 API 响应格式
 */
export const assertApiResponse = {
  success: (response: { body: { code: number; message: string; data: unknown } }) => {
    expect(response.body.code).toBe(200);
    expect(response.body.message).toBeDefined();
    expect(response.body.data).toBeDefined();
  },

  error: (
    response: { status: number; body: { code: number; message: string } },
    expectedStatus: number,
    expectedMessage?: string
  ) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.code).toBe(expectedStatus);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  },

  paginated: (response: {
    body: {
      data: { list: unknown[]; total: number; page: number; pageSize: number };
    };
  }) => {
    expect(response.body.data.list).toBeDefined();
    expect(Array.isArray(response.body.data.list)).toBe(true);
    expect(typeof response.body.data.total).toBe('number');
    expect(typeof response.body.data.page).toBe('number');
    expect(typeof response.body.data.pageSize).toBe('number');
  },
};

