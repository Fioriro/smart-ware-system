/**
 * 入库流程集成测试
 * 测试完整的入库流程：Controller → Service → Repository → Database
 * 
 * 验证需求：
 * - FR-IN-001: 单个商品入库
 * - FR-IN-002: 批量入库
 * - FR-IN-003: 入库记录查看
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import {
  createTestApp,
  getTestPrisma,
  closeTestPrisma,
  createTestUser,
  generateTestToken,
  createTestCategory,
  createTestSupplier,
  createTestProduct,
  cleanupTestData,
  cleanupTestProductsAndTransactions,
  TestUser,
  wait,
} from './setup';

const TEST_PREFIX = 'INT_INBOUND_';

describe('入库流程集成测试', () => {
  const app = createTestApp();
  let testUser: TestUser;
  let authToken: string;
  let testCategoryId: number;
  let testSupplierId: number;
  let testSupplier2Id: number;

  beforeAll(async () => {
    const prisma = getTestPrisma();
    await prisma.$connect();

    // 创建测试用户
    testUser = await createTestUser(`${TEST_PREFIX}user`, 'password123', 'admin');
    authToken = generateTestToken(testUser);

    // 创建测试分类
    const category = await createTestCategory(`${TEST_PREFIX}分类`);
    testCategoryId = category.id;

    // 创建测试供应商
    const supplier = await createTestSupplier(`${TEST_PREFIX}SUP001`, `${TEST_PREFIX}供应商A`);
    testSupplierId = supplier.id;

    // 创建第二个测试供应商
    const supplier2 = await createTestSupplier(`${TEST_PREFIX}SUP002`, `${TEST_PREFIX}供应商B`);
    testSupplier2Id = supplier2.id;
  });

  afterAll(async () => {
    await cleanupTestData(TEST_PREFIX);
    await closeTestPrisma();
  });

  beforeEach(async () => {
    // 清理测试商品和交易记录
    await cleanupTestProductsAndTransactions(TEST_PREFIX);
  });

  /**
   * FR-IN-001: 单个商品入库
   * AC1: 可通过输入框输入SKU，系统自动匹配商品信息
   * AC2: 选择供应商（下拉列表）
   * AC3: 输入入库数量（必须为正整数）
   * AC4: 可输入备注信息
   * AC5: 提交后，商品库存数量增加相应数量
   * AC6: 系统自动生成审计日志记录
   */
  describe('POST /api/v1/inventory/inbound - 单个商品入库 (FR-IN-001)', () => {
    /**
     * **Validates: FR-IN-001 AC1, AC5**
     * 测试通过 SKU 匹配商品并成功入库
     */
    it('应该成功执行入库操作并更新库存', async () => {
      // 创建测试商品
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU001`,
        `${TEST_PREFIX}测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50,
          supplierId: testSupplierId,
          remark: '测试入库',
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.data.sku).toBe(product.sku);
      expect(response.body.data.quantity).toBe(50);
      expect(response.body.data.quantityBefore).toBe(100);
      expect(response.body.data.quantityAfter).toBe(150);

      // 验证数据库中的库存已更新
      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(150);

      // 验证交易记录已创建
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.quantity).toBe(50);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(150);
    });

    /**
     * **Validates: FR-IN-001 AC2**
     * 测试选择供应商入库
     */
    it('应该正确记录供应商信息', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_SUP`,
        `${TEST_PREFIX}供应商测试商品`,
        testCategoryId,
        50
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
          supplierId: testSupplierId,
          remark: '供应商入库测试',
        });

      expect(response.status).toBe(201);

      // 验证交易记录中包含供应商信息
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });
      expect(transaction?.supplierId).toBe(testSupplierId);
    });

    /**
     * **Validates: FR-IN-001 AC4**
     * 测试备注信息记录
     */
    it('应该正确记录备注信息', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_REMARK`,
        `${TEST_PREFIX}备注测试商品`,
        testCategoryId,
        100
      );

      const remarkText = '这是一条测试备注信息';
      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 20,
          supplierId: testSupplierId,
          remark: remarkText,
        });

      expect(response.status).toBe(201);

      // 验证交易记录中包含备注信息
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });
      expect(transaction?.remark).toBe(remarkText);
    });

    /**
     * **Validates: FR-IN-001 AC6**
     * 测试审计日志自动生成
     */
    it('应该自动生成审计日志记录', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_AUDIT`,
        `${TEST_PREFIX}审计日志测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 40,
          supplierId: testSupplierId,
          remark: '审计日志测试',
        });

      // 验证审计日志（inventory_transactions 表）已创建
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });

      expect(transaction).not.toBeNull();
      expect(transaction?.operatorId).toBe(testUser.id);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(140);
      expect(transaction?.createdAt).toBeDefined();
    });

    /**
     * **Validates: FR-IN-001 AC1**
     * 测试商品不存在时的错误处理
     */
    it('商品不存在时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'NONEXISTENT_SKU',
          quantity: 50,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('商品不存在');
    });

    /**
     * **Validates: FR-IN-001 AC3**
     * 测试入库数量为零时的错误处理
     */
    it('入库数量为零时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU002`,
        `${TEST_PREFIX}测试商品2`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 0,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('入库数量必须为正整数');
    });

    /**
     * **Validates: FR-IN-001 AC3**
     * 测试入库数量为负数时的错误处理
     */
    it('入库数量为负数时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU003`,
        `${TEST_PREFIX}测试商品3`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: -10,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('入库数量必须为正整数');
    });

    /**
     * **Validates: FR-IN-001 AC3**
     * 测试入库数量为小数时的错误处理
     */
    it('入库数量为小数时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_DECIMAL`,
        `${TEST_PREFIX}小数测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 10.5,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('入库数量必须为整数');
    });

    /**
     * 测试 SKU 为空时的错误处理
     */
    it('SKU 为空时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: '',
          quantity: 50,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('SKU 不能为空');
    });

    /**
     * 测试入库数量为空时的错误处理
     */
    it('入库数量为空时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_EMPTY_QTY`,
        `${TEST_PREFIX}空数量测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('入库数量不能为空');
    });

    /**
     * 测试不带供应商的入库（供应商可选）
     */
    it('不带供应商时应该成功入库', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_NO_SUP`,
        `${TEST_PREFIX}无供应商测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 25,
          remark: '无供应商入库',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantityAfter).toBe(125);

      // 验证交易记录中供应商为空
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });
      expect(transaction?.supplierId).toBeNull();
    });

    /**
     * 测试未认证时的错误处理
     */
    it('未认证时应返回 401', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .send({
          sku: 'TEST_SKU',
          quantity: 50,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(401);
    });
  });

  /**
   * FR-IN-002: 批量入库
   * AC1: 提供表格形式的批量录入界面
   * AC2: 每行包含：SKU输入框、商品名称（自动填充）、供应商选择、入库数量、备注
   * AC3: 支持动态添加/删除行
   * AC4: 一次性提交所有入库记录
   * AC5: 提交前验证所有行数据的完整性和正确性
   * AC6: 部分行验证失败时，高亮显示错误行，不提交任何数据
   * AC7: 全部验证通过后，批量更新库存并生成审计日志
   */
  describe('POST /api/v1/inventory/inbound/batch - 批量入库 (FR-IN-002)', () => {
    /**
     * **Validates: FR-IN-002 AC4, AC7**
     * 测试成功执行批量入库操作
     */
    it('应该成功执行批量入库操作', async () => {
      // 创建多个测试商品
      const product1 = await createTestProduct(
        `${TEST_PREFIX}BATCH001`,
        `${TEST_PREFIX}批量商品1`,
        testCategoryId,
        100
      );
      const product2 = await createTestProduct(
        `${TEST_PREFIX}BATCH002`,
        `${TEST_PREFIX}批量商品2`,
        testCategoryId,
        50
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product1.sku, quantity: 20, supplierId: testSupplierId },
            { sku: product2.sku, quantity: 30, supplierId: testSupplierId },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.data.success).toBe(true);
      expect(response.body.data.totalItems).toBe(2);
      expect(response.body.data.results).toHaveLength(2);

      // 验证数据库中的库存已更新
      const prisma = getTestPrisma();
      const updatedProduct1 = await prisma.product.findUnique({
        where: { id: product1.id },
      });
      const updatedProduct2 = await prisma.product.findUnique({
        where: { id: product2.id },
      });

      expect(updatedProduct1?.quantity).toBe(120);
      expect(updatedProduct2?.quantity).toBe(80);
    });

    /**
     * **Validates: FR-IN-002 AC7**
     * 测试批量入库生成多条审计日志
     */
    it('批量入库应该为每个商品生成审计日志', async () => {
      const product1 = await createTestProduct(
        `${TEST_PREFIX}BATCH_LOG1`,
        `${TEST_PREFIX}批量日志商品1`,
        testCategoryId,
        100
      );
      const product2 = await createTestProduct(
        `${TEST_PREFIX}BATCH_LOG2`,
        `${TEST_PREFIX}批量日志商品2`,
        testCategoryId,
        50
      );

      await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product1.sku, quantity: 15, supplierId: testSupplierId, remark: '批量入库1' },
            { sku: product2.sku, quantity: 25, supplierId: testSupplier2Id, remark: '批量入库2' },
          ],
        });

      // 验证审计日志
      const prisma = getTestPrisma();
      const transactions = await prisma.inventoryTransaction.findMany({
        where: {
          sku: { in: [product1.sku, product2.sku] },
          type: 'IN',
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(transactions).toHaveLength(2);
      expect(transactions[0].sku).toBe(product1.sku);
      expect(transactions[0].quantity).toBe(15);
      expect(transactions[0].supplierId).toBe(testSupplierId);
      expect(transactions[1].sku).toBe(product2.sku);
      expect(transactions[1].quantity).toBe(25);
      expect(transactions[1].supplierId).toBe(testSupplier2Id);
    });

    /**
     * **Validates: FR-IN-002 AC5, AC6**
     * 测试批量入库中某一行商品不存在时应回滚所有操作
     */
    it('批量入库中某一行商品不存在时应回滚所有操作', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}BATCH003`,
        `${TEST_PREFIX}批量商品3`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product.sku, quantity: 20, supplierId: testSupplierId },
            { sku: 'NONEXISTENT_SKU', quantity: 30, supplierId: testSupplierId },
          ],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('不存在');

      // 验证第一个商品的库存没有变化（事务回滚）
      const prisma = getTestPrisma();
      const unchangedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(unchangedProduct?.quantity).toBe(100);

      // 验证没有生成任何交易记录
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { sku: product.sku, type: 'IN' },
      });
      expect(transactions).toHaveLength(0);
    });

    /**
     * **Validates: FR-IN-002 AC5, AC6**
     * 测试批量入库中某一行数量无效时应回滚所有操作
     */
    it('批量入库中某一行数量无效时应回滚所有操作', async () => {
      const product1 = await createTestProduct(
        `${TEST_PREFIX}BATCH_INVALID1`,
        `${TEST_PREFIX}无效数量商品1`,
        testCategoryId,
        100
      );
      const product2 = await createTestProduct(
        `${TEST_PREFIX}BATCH_INVALID2`,
        `${TEST_PREFIX}无效数量商品2`,
        testCategoryId,
        50
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product1.sku, quantity: 20, supplierId: testSupplierId },
            { sku: product2.sku, quantity: -10, supplierId: testSupplierId }, // 无效数量
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('入库数量必须为正整数');

      // 验证两个商品的库存都没有变化
      const prisma = getTestPrisma();
      const unchangedProduct1 = await prisma.product.findUnique({
        where: { id: product1.id },
      });
      const unchangedProduct2 = await prisma.product.findUnique({
        where: { id: product2.id },
      });
      expect(unchangedProduct1?.quantity).toBe(100);
      expect(unchangedProduct2?.quantity).toBe(50);
    });

    /**
     * **Validates: FR-IN-002 AC5**
     * 测试入库列表为空时应返回错误
     */
    it('入库列表为空时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('入库列表不能为空');
    });

    /**
     * **Validates: FR-IN-002 AC5**
     * 测试批量入库中某一行 SKU 为空时应返回错误
     */
    it('批量入库中某一行 SKU 为空时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}BATCH_EMPTY_SKU`,
        `${TEST_PREFIX}空SKU测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product.sku, quantity: 20, supplierId: testSupplierId },
            { sku: '', quantity: 30, supplierId: testSupplierId },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('SKU 不能为空');
    });

    /**
     * 测试批量入库支持不同供应商
     */
    it('批量入库应该支持不同供应商', async () => {
      const product1 = await createTestProduct(
        `${TEST_PREFIX}BATCH_MULTI_SUP1`,
        `${TEST_PREFIX}多供应商商品1`,
        testCategoryId,
        100
      );
      const product2 = await createTestProduct(
        `${TEST_PREFIX}BATCH_MULTI_SUP2`,
        `${TEST_PREFIX}多供应商商品2`,
        testCategoryId,
        50
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product1.sku, quantity: 10, supplierId: testSupplierId },
            { sku: product2.sku, quantity: 20, supplierId: testSupplier2Id },
          ],
        });

      expect(response.status).toBe(201);

      // 验证交易记录中的供应商信息
      const prisma = getTestPrisma();
      const transaction1 = await prisma.inventoryTransaction.findFirst({
        where: { sku: product1.sku, type: 'IN' },
      });
      const transaction2 = await prisma.inventoryTransaction.findFirst({
        where: { sku: product2.sku, type: 'IN' },
      });

      expect(transaction1?.supplierId).toBe(testSupplierId);
      expect(transaction2?.supplierId).toBe(testSupplier2Id);
    });

    /**
     * 测试批量入库支持大量商品
     */
    it('批量入库应该支持多个商品同时入库', async () => {
      // 创建5个测试商品
      const products = await Promise.all([
        createTestProduct(`${TEST_PREFIX}BATCH_MULTI1`, `${TEST_PREFIX}多商品1`, testCategoryId, 10),
        createTestProduct(`${TEST_PREFIX}BATCH_MULTI2`, `${TEST_PREFIX}多商品2`, testCategoryId, 20),
        createTestProduct(`${TEST_PREFIX}BATCH_MULTI3`, `${TEST_PREFIX}多商品3`, testCategoryId, 30),
        createTestProduct(`${TEST_PREFIX}BATCH_MULTI4`, `${TEST_PREFIX}多商品4`, testCategoryId, 40),
        createTestProduct(`${TEST_PREFIX}BATCH_MULTI5`, `${TEST_PREFIX}多商品5`, testCategoryId, 50),
      ]);

      const response = await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: products.map((p, i) => ({
            sku: p.sku,
            quantity: (i + 1) * 5,
            supplierId: testSupplierId,
          })),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.totalItems).toBe(5);
      expect(response.body.data.results).toHaveLength(5);

      // 验证所有商品库存都已更新
      const prisma = getTestPrisma();
      for (let i = 0; i < products.length; i++) {
        const updatedProduct = await prisma.product.findUnique({
          where: { id: products[i].id },
        });
        expect(updatedProduct?.quantity).toBe((i + 1) * 10 + (i + 1) * 5);
      }
    });
  });

  /**
   * FR-IN-003: 入库记录查看
   * AC1: 显示入库记录列表，包含入库时间、SKU、商品名称、供应商、数量、操作人
   * AC2: 支持按时间范围筛选
   * AC3: 支持按SKU、供应商搜索
   * AC4: 支持分页显示
   */
  describe('GET /api/v1/inventory/inbound/records - 入库记录查询 (FR-IN-003)', () => {
    let recordProduct: { id: number; sku: string; name: string; categoryId: number; quantity: number; version: number; minThreshold: number };

    beforeEach(async () => {
      // 创建测试商品并执行入库
      recordProduct = await createTestProduct(
        `${TEST_PREFIX}RECORD001`,
        `${TEST_PREFIX}记录测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: recordProduct.sku,
          quantity: 25,
          supplierId: testSupplierId,
          remark: '测试入库记录',
        });
    });

    /**
     * **Validates: FR-IN-003 AC1**
     * 测试返回入库记录列表
     */
    it('应该返回入库记录列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/inbound/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toBeDefined();
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);

      const record = response.body.data.list.find(
        (r: { sku: string }) => r.sku === recordProduct.sku
      );
      expect(record).toBeDefined();
      expect(record.type).toBe('IN');
      expect(record.quantity).toBe(25);
    });

    /**
     * **Validates: FR-IN-003 AC1**
     * 测试入库记录包含所有必要字段
     */
    it('入库记录应包含所有必要字段', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/inbound/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const record = response.body.data.list.find(
        (r: { sku: string }) => r.sku === recordProduct.sku
      );

      // 验证必要字段
      expect(record.id).toBeDefined();
      expect(record.type).toBe('IN');
      expect(record.sku).toBe(recordProduct.sku);
      expect(record.quantity).toBe(25);
      expect(record.quantityBefore).toBe(100);
      expect(record.quantityAfter).toBe(125);
      expect(record.supplierId).toBe(testSupplierId);
      expect(record.operatorId).toBe(testUser.id);
      expect(record.createdAt).toBeDefined();
    });

    /**
     * **Validates: FR-IN-003 AC4**
     * 测试分页功能
     */
    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/inbound/records?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(5);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.list.length).toBeLessThanOrEqual(5);
    });

    /**
     * **Validates: FR-IN-003 AC3**
     * 测试按 SKU 搜索
     */
    it('应该支持按 SKU 搜索', async () => {
      // 创建另一个商品并入库
      const anotherProduct = await createTestProduct(
        `${TEST_PREFIX}RECORD_SEARCH`,
        `${TEST_PREFIX}搜索测试商品`,
        testCategoryId,
        50
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: anotherProduct.sku,
          quantity: 15,
          supplierId: testSupplierId,
        });

      // 按 SKU 搜索
      const response = await request(app)
        .get(`/api/v1/inventory/inbound/records?sku=${anotherProduct.sku}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);
      
      // 验证所有返回的记录都匹配搜索的 SKU
      response.body.data.list.forEach((record: { sku: string }) => {
        expect(record.sku).toBe(anotherProduct.sku);
      });
    });

    /**
     * **Validates: FR-IN-003 AC3**
     * 测试按供应商搜索
     */
    it('应该支持按供应商搜索', async () => {
      // 创建商品并使用第二个供应商入库
      const supplierProduct = await createTestProduct(
        `${TEST_PREFIX}RECORD_SUP_SEARCH`,
        `${TEST_PREFIX}供应商搜索测试商品`,
        testCategoryId,
        50
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: supplierProduct.sku,
          quantity: 10,
          supplierId: testSupplier2Id,
        });

      // 按供应商搜索
      const response = await request(app)
        .get(`/api/v1/inventory/inbound/records?supplierId=${testSupplier2Id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);
      
      // 验证所有返回的记录都匹配搜索的供应商
      response.body.data.list.forEach((record: { supplierId: number }) => {
        expect(record.supplierId).toBe(testSupplier2Id);
      });
    });

    /**
     * **Validates: FR-IN-003 AC2**
     * 测试按时间范围筛选
     */
    it('应该支持按时间范围筛选', async () => {
      // 获取今天的日期范围
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const response = await request(app)
        .get(`/api/v1/inventory/inbound/records?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);

      // 验证所有返回的记录都在时间范围内
      response.body.data.list.forEach((record: { createdAt: string }) => {
        const recordDate = new Date(record.createdAt);
        expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(recordDate.getTime()).toBeLessThan(endDate.getTime());
      });
    });

    /**
     * 测试无效日期格式
     */
    it('无效日期格式应返回错误', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/inbound/records?startDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('时间格式无效');
    });

    /**
     * 测试未认证时的错误处理
     */
    it('未认证时应返回 401', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/inbound/records');

      expect(response.status).toBe(401);
    });
  });

  /**
   * 库存数量更新测试
   */
  describe('库存数量更新测试', () => {
    /**
     * 测试入库后库存正确增加
     */
    it('入库后库存应该正确增加', async () => {
      const initialQuantity = 100;
      const inboundQuantity = 50;

      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_UPDATE`,
        `${TEST_PREFIX}库存更新测试商品`,
        testCategoryId,
        initialQuantity
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: inboundQuantity,
          supplierId: testSupplierId,
        });

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(updatedProduct?.quantity).toBe(initialQuantity + inboundQuantity);
    });

    /**
     * 测试多次入库后库存累计正确
     */
    it('多次入库后库存应该累计正确', async () => {
      const initialQuantity = 50;
      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_MULTI`,
        `${TEST_PREFIX}多次入库测试商品`,
        testCategoryId,
        initialQuantity
      );

      // 第一次入库
      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 20,
          supplierId: testSupplierId,
        });

      // 第二次入库
      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
          supplierId: testSupplierId,
        });

      // 第三次入库
      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 10,
          supplierId: testSupplierId,
        });

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      // 50 + 20 + 30 + 10 = 110
      expect(updatedProduct?.quantity).toBe(110);
    });

    /**
     * 测试从零库存开始入库
     */
    it('从零库存开始入库应该成功', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_ZERO`,
        `${TEST_PREFIX}零库存测试商品`,
        testCategoryId,
        0 // 初始库存为0
      );

      const response = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 100,
          supplierId: testSupplierId,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantityBefore).toBe(0);
      expect(response.body.data.quantityAfter).toBe(100);

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(100);
    });
  });

  /**
   * 乐观锁并发测试
   */
  describe('乐观锁并发测试', () => {
    /**
     * 测试乐观锁版本号更新
     */
    it('入库后版本号应该递增', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}VERSION_TEST`,
        `${TEST_PREFIX}版本号测试商品`,
        testCategoryId,
        100
      );

      const initialVersion = product.version;

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50,
          supplierId: testSupplierId,
        });

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(updatedProduct?.version).toBe(initialVersion + 1);
    });

    /**
     * 测试并发入库操作（模拟乐观锁冲突）
     * 注意：这个测试模拟并发场景，实际并发冲突在高并发环境下更容易发生
     */
    it('并发入库时应该正确处理乐观锁', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}CONCURRENT`,
        `${TEST_PREFIX}并发测试商品`,
        testCategoryId,
        100
      );

      // 同时发起两个入库请求
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/v1/inventory/inbound')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sku: product.sku,
            quantity: 30,
            supplierId: testSupplierId,
            remark: '并发入库1',
          }),
        request(app)
          .post('/api/v1/inventory/inbound')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sku: product.sku,
            quantity: 20,
            supplierId: testSupplierId,
            remark: '并发入库2',
          }),
      ]);

      // 至少有一个请求应该成功
      const successCount = [response1, response2].filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThanOrEqual(1);

      // 如果有冲突，应该返回 409 状态码
      const conflictCount = [response1, response2].filter(r => r.status === 409).length;
      
      // 验证最终库存
      const prisma = getTestPrisma();
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      // 如果两个都成功，库存应该是 100 + 30 + 20 = 150
      // 如果只有一个成功，库存应该是 100 + 30 = 130 或 100 + 20 = 120
      if (successCount === 2) {
        expect(finalProduct?.quantity).toBe(150);
      } else if (successCount === 1) {
        expect([120, 130]).toContain(finalProduct?.quantity);
      }
    });
  });

  /**
   * 审计日志生成测试
   */
  describe('审计日志生成测试', () => {
    /**
     * 测试单个入库生成审计日志
     */
    it('单个入库应该生成完整的审计日志', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT_SINGLE`,
        `${TEST_PREFIX}单个审计日志测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 40,
          supplierId: testSupplierId,
          remark: '审计日志测试备注',
        });

      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });

      expect(transaction).not.toBeNull();
      expect(transaction?.type).toBe('IN');
      expect(transaction?.productId).toBe(product.id);
      expect(transaction?.sku).toBe(product.sku);
      expect(transaction?.quantity).toBe(40);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(140);
      expect(transaction?.supplierId).toBe(testSupplierId);
      expect(transaction?.operatorId).toBe(testUser.id);
      expect(transaction?.remark).toBe('审计日志测试备注');
      expect(transaction?.createdAt).toBeDefined();
    });

    /**
     * 测试批量入库生成多条审计日志
     */
    it('批量入库应该为每个商品生成独立的审计日志', async () => {
      const product1 = await createTestProduct(
        `${TEST_PREFIX}AUDIT_BATCH1`,
        `${TEST_PREFIX}批量审计日志商品1`,
        testCategoryId,
        50
      );
      const product2 = await createTestProduct(
        `${TEST_PREFIX}AUDIT_BATCH2`,
        `${TEST_PREFIX}批量审计日志商品2`,
        testCategoryId,
        60
      );
      const product3 = await createTestProduct(
        `${TEST_PREFIX}AUDIT_BATCH3`,
        `${TEST_PREFIX}批量审计日志商品3`,
        testCategoryId,
        70
      );

      await request(app)
        .post('/api/v1/inventory/inbound/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { sku: product1.sku, quantity: 10, supplierId: testSupplierId, remark: '批量1' },
            { sku: product2.sku, quantity: 20, supplierId: testSupplier2Id, remark: '批量2' },
            { sku: product3.sku, quantity: 30, supplierId: testSupplierId, remark: '批量3' },
          ],
        });

      const prisma = getTestPrisma();
      const transactions = await prisma.inventoryTransaction.findMany({
        where: {
          sku: { in: [product1.sku, product2.sku, product3.sku] },
          type: 'IN',
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(transactions).toHaveLength(3);

      // 验证每条记录
      const tx1 = transactions.find(t => t.sku === product1.sku);
      const tx2 = transactions.find(t => t.sku === product2.sku);
      const tx3 = transactions.find(t => t.sku === product3.sku);

      expect(tx1?.quantity).toBe(10);
      expect(tx1?.quantityBefore).toBe(50);
      expect(tx1?.quantityAfter).toBe(60);
      expect(tx1?.remark).toBe('批量1');

      expect(tx2?.quantity).toBe(20);
      expect(tx2?.quantityBefore).toBe(60);
      expect(tx2?.quantityAfter).toBe(80);
      expect(tx2?.supplierId).toBe(testSupplier2Id);

      expect(tx3?.quantity).toBe(30);
      expect(tx3?.quantityBefore).toBe(70);
      expect(tx3?.quantityAfter).toBe(100);
    });

    /**
     * 测试审计日志记录操作人信息
     */
    it('审计日志应该正确记录操作人信息', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT_OPERATOR`,
        `${TEST_PREFIX}操作人测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 25,
          supplierId: testSupplierId,
        });

      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });

      expect(transaction?.operatorId).toBe(testUser.id);
    });

    /**
     * 测试审计日志记录时间戳
     */
    it('审计日志应该记录正确的时间戳', async () => {
      const beforeTime = new Date();

      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT_TIME`,
        `${TEST_PREFIX}时间戳测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 15,
          supplierId: testSupplierId,
        });

      const afterTime = new Date();

      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'IN' },
      });

      expect(transaction?.createdAt).toBeDefined();
      const transactionTime = new Date(transaction!.createdAt);
      expect(transactionTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime() - 1000);
      expect(transactionTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000);
    });
  });

  /**
   * 完整入库流程测试
   */
  describe('完整入库流程测试', () => {
    /**
     * 测试完整的入库-查询流程
     */
    it('应该正确执行完整的入库-查询流程', async () => {
      const prisma = getTestPrisma();

      // 1. 创建商品（初始库存 0）
      const product = await createTestProduct(
        `${TEST_PREFIX}FLOW001`,
        `${TEST_PREFIX}流程测试商品`,
        testCategoryId,
        0
      );

      // 2. 执行入库
      const inboundResponse = await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 100,
          supplierId: testSupplierId,
          remark: '首次入库',
        });

      expect(inboundResponse.status).toBe(201);
      expect(inboundResponse.body.data.quantityBefore).toBe(0);
      expect(inboundResponse.body.data.quantityAfter).toBe(100);

      // 3. 查询入库记录
      const recordsResponse = await request(app)
        .get(`/api/v1/inventory/inbound/records?sku=${product.sku}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(recordsResponse.status).toBe(200);
      expect(recordsResponse.body.data.list.length).toBeGreaterThanOrEqual(1);

      const record = recordsResponse.body.data.list.find(
        (r: { sku: string }) => r.sku === product.sku
      );
      expect(record).toBeDefined();
      expect(record.quantity).toBe(100);
      expect(record.remark).toBe('首次入库');

      // 4. 验证数据库状态
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.quantity).toBe(100);
    });
  });
});


