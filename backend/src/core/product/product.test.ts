/**
 * 商品模块集成测试
 * 测试商品 API 端点
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';
import { getPrismaClient, closeContainer } from '../../shared/container';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('Product API', () => {
  let app: ReturnType<typeof createApp>;
  let prisma: PrismaClient;
  let authToken: string;
  let testCategoryId: number;
  let testProductId: number;

  beforeAll(async () => {
    app = createApp();
    prisma = getPrismaClient();
    await prisma.$connect();

    // 创建测试用户并生成 token
    const testUser = await prisma.user.upsert({
      where: { username: 'product_test_user' },
      update: {},
      create: {
        username: 'product_test_user',
        password: '$2b$10$test_hashed_password',
        role: 'admin',
        status: 1,
      },
    });

    authToken = jwt.sign(
      { userId: testUser.id, username: testUser.username, role: testUser.role },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '1h' }
    );

    // 创建测试分类
    const testCategory = await prisma.category.create({
      data: {
        name: '测试分类_商品测试',
      },
    });
    testCategoryId = testCategory.id;
  });

  afterAll(async () => {
    // 清理测试数据
    await prisma.product.deleteMany({
      where: { sku: { startsWith: 'TEST-PROD-' } },
    });
    await prisma.category.deleteMany({
      where: { name: '测试分类_商品测试' },
    });
    await prisma.user.deleteMany({
      where: { username: 'product_test_user' },
    });
    await closeContainer();
  });

  beforeEach(async () => {
    // 清理之前的测试商品
    await prisma.product.deleteMany({
      where: { sku: { startsWith: 'TEST-PROD-' } },
    });
  });

  describe('POST /api/v1/products', () => {
    it('应该成功创建商品', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-PROD-001',
          name: '测试商品1',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 100,
          minThreshold: 10,
          costPrice: 50.00,
          salePrice: 100.00,
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.data.sku).toBe('TEST-PROD-001');
      expect(response.body.data.name).toBe('测试商品1');
      expect(response.body.data.quantity).toBe(100);
      expect(response.body.data.isLowStock).toBe(false);

      testProductId = response.body.data.id;
    });

    it('应该使用默认值创建商品', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-PROD-002',
          name: '测试商品2',
          categoryId: testCategoryId,
          unit: '个',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantity).toBe(0);
      expect(response.body.data.minThreshold).toBe(10);
      expect(response.body.data.isLowStock).toBe(true); // 0 <= 10
    });

    it('当 SKU 重复时应返回错误', async () => {
      // 先创建一个商品
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-PROD-DUP',
          name: '测试商品',
          categoryId: testCategoryId,
          unit: '个',
        });

      // 尝试创建相同 SKU 的商品
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'TEST-PROD-DUP',
          name: '另一个商品',
          categoryId: testCategoryId,
          unit: '个',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('SKU 已存在');
    });

    it('当缺少必填字段时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试商品',
          categoryId: testCategoryId,
          unit: '个',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('SKU 不能为空');
    });

    it('未认证时应返回 401', async () => {
      const response = await request(app)
        .post('/api/v1/products')
        .send({
          sku: 'TEST-PROD-003',
          name: '测试商品',
          categoryId: testCategoryId,
          unit: '个',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/products', () => {
    beforeEach(async () => {
      // 创建测试商品
      await prisma.product.createMany({
        data: [
          {
            sku: 'TEST-PROD-LIST-001',
            name: '列表测试商品1',
            categoryId: testCategoryId,
            unit: '个',
            quantity: 100,
            minThreshold: 10,
          },
          {
            sku: 'TEST-PROD-LIST-002',
            name: '列表测试商品2',
            categoryId: testCategoryId,
            unit: '箱',
            quantity: 5,
            minThreshold: 10,
          },
          {
            sku: 'TEST-PROD-LIST-003',
            name: '搜索测试商品',
            categoryId: testCategoryId,
            unit: '个',
            quantity: 50,
            minThreshold: 10,
          },
        ],
      });
    });

    it('应该返回商品列表', async () => {
      const response = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toBeDefined();
      expect(response.body.data.total).toBeGreaterThanOrEqual(3);
    });

    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/products?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeLessThanOrEqual(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(2);
    });

    it('应该支持关键字搜索', async () => {
      const response = await request(app)
        .get('/api/v1/products?keyword=搜索测试')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data.list[0].name).toContain('搜索测试');
    });

    it('应该支持按分类筛选', async () => {
      const response = await request(app)
        .get(`/api/v1/products?categoryId=${testCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.every((p: { categoryId: number }) => p.categoryId === testCategoryId)).toBe(true);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    let productId: number;

    beforeEach(async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'TEST-PROD-DETAIL',
          name: '详情测试商品',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 100,
          minThreshold: 10,
        },
      });
      productId = product.id;
    });

    it('应该返回商品详情', async () => {
      const response = await request(app)
        .get(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(productId);
      expect(response.body.data.sku).toBe('TEST-PROD-DETAIL');
    });

    it('当商品不存在时应返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/products/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('商品不存在');
    });
  });

  describe('GET /api/v1/products/sku/:sku', () => {
    beforeEach(async () => {
      await prisma.product.create({
        data: {
          sku: 'TEST-PROD-SKU-QUERY',
          name: 'SKU查询测试商品',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 100,
          minThreshold: 10,
        },
      });
    });

    it('应该根据 SKU 返回商品', async () => {
      const response = await request(app)
        .get('/api/v1/products/sku/TEST-PROD-SKU-QUERY')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.sku).toBe('TEST-PROD-SKU-QUERY');
    });

    it('当 SKU 不存在时应返回 404', async () => {
      const response = await request(app)
        .get('/api/v1/products/sku/NON-EXISTENT-SKU')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/products/low-stock', () => {
    beforeEach(async () => {
      await prisma.product.createMany({
        data: [
          {
            sku: 'TEST-PROD-LOW-001',
            name: '低库存商品1',
            categoryId: testCategoryId,
            unit: '个',
            quantity: 5,
            minThreshold: 10,
          },
          {
            sku: 'TEST-PROD-LOW-002',
            name: '低库存商品2',
            categoryId: testCategoryId,
            unit: '个',
            quantity: 10,
            minThreshold: 10,
          },
          {
            sku: 'TEST-PROD-NORMAL',
            name: '正常库存商品',
            categoryId: testCategoryId,
            unit: '个',
            quantity: 100,
            minThreshold: 10,
          },
        ],
      });
    });

    it('应该返回低库存商品列表', async () => {
      const response = await request(app)
        .get('/api/v1/products/low-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.every((p: { isLowStock: boolean }) => p.isLowStock === true)).toBe(true);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    let productId: number;

    beforeEach(async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'TEST-PROD-UPDATE',
          name: '更新测试商品',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 100,
          minThreshold: 10,
        },
      });
      productId = product.id;
    });

    it('应该成功更新商品', async () => {
      const response = await request(app)
        .put(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '更新后的商品名称',
          minThreshold: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('更新后的商品名称');
      expect(response.body.data.minThreshold).toBe(20);
      // SKU 应该保持不变
      expect(response.body.data.sku).toBe('TEST-PROD-UPDATE');
    });

    it('当商品不存在时应返回 404', async () => {
      const response = await request(app)
        .put('/api/v1/products/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '新名称',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('应该成功删除商品', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'TEST-PROD-DELETE',
          name: '删除测试商品',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 0,
          minThreshold: 10,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('删除成功');

      // 验证软删除
      const deletedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(deletedProduct?.deletedAt).not.toBeNull();
    });

    it('删除有库存的商品时应返回警告', async () => {
      const product = await prisma.product.create({
        data: {
          sku: 'TEST-PROD-DELETE-STOCK',
          name: '有库存的删除测试商品',
          categoryId: testCategoryId,
          unit: '个',
          quantity: 100,
          minThreshold: 10,
        },
      });

      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.warning).toBe('该商品有库存，已删除');
    });

    it('当商品不存在时应返回 404', async () => {
      const response = await request(app)
        .delete('/api/v1/products/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
