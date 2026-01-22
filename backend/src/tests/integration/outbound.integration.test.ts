/**
 * 出库流程集成测试
 * 测试完整的出库流程：Controller → Service → Repository → Database
 * 
 * 验证需求：
 * - FR-OUT-001: 商品出库
 * - FR-OUT-002: 出库记录查看
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

const TEST_PREFIX = 'INT_OUTBOUND_';

describe('出库流程集成测试', () => {
  const app = createTestApp();
  let testUser: TestUser;
  let authToken: string;
  let testCategoryId: number;
  let testSupplierId: number;

  beforeAll(async () => {
    const prisma = getTestPrisma();
    await prisma.$connect();

    // 创建测试用户
    testUser = await createTestUser(`${TEST_PREFIX}user`, 'password123', 'admin');
    authToken = generateTestToken(testUser);

    // 创建测试分类
    const category = await createTestCategory(`${TEST_PREFIX}分类`);
    testCategoryId = category.id;

    // 创建测试供应商（用于入库-出库流程测试）
    const supplier = await createTestSupplier(`${TEST_PREFIX}SUP001`, `${TEST_PREFIX}供应商A`);
    testSupplierId = supplier.id;
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
   * FR-OUT-001: 商品出库
   * AC1: 可通过输入框输入SKU，系统自动匹配商品信息并显示当前库存
   * AC2: 输入出库数量（必须为正整数）
   * AC3: 出库数量不能超过当前库存
   * AC4: 库存不足时，显示告警信息，拒绝出库操作
   * AC5: 可输入备注信息
   * AC6: 提交后，商品库存数量减少相应数量
   * AC7: 系统自动生成审计日志记录
   */
  describe('POST /api/v1/inventory/outbound - 商品出库 (FR-OUT-001)', () => {
    /**
     * **Validates: FR-OUT-001 AC1, AC6**
     * 测试通过 SKU 匹配商品并成功出库
     */
    it('应该成功执行出库操作并更新库存', async () => {
      // 创建测试商品
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU001`,
        `${TEST_PREFIX}测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
          remark: '测试出库',
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(201);
      expect(response.body.data.sku).toBe(product.sku);
      expect(response.body.data.quantity).toBe(30);
      expect(response.body.data.quantityBefore).toBe(100);
      expect(response.body.data.quantityAfter).toBe(70);

      // 验证数据库中的库存已更新
      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(70);

      // 验证交易记录已创建
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });
      expect(transaction).not.toBeNull();
      expect(transaction?.quantity).toBe(30);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(70);
    });

    /**
     * **Validates: FR-OUT-001 AC3**
     * 测试出库数量等于库存时应该成功（库存清零）
     */
    it('出库数量等于库存时应该成功（库存清零）', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_ZERO`,
        `${TEST_PREFIX}清零测试商品`,
        testCategoryId,
        50
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50,
          remark: '清空库存',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantityBefore).toBe(50);
      expect(response.body.data.quantityAfter).toBe(0);

      // 验证数据库中的库存已清零
      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(0);
    });

    /**
     * **Validates: FR-OUT-001 AC3, AC4**
     * 测试库存不足时应返回错误
     */
    it('库存不足时应返回错误并拒绝出库', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_INSUFFICIENT`,
        `${TEST_PREFIX}库存不足测试商品`,
        testCategoryId,
        20
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50, // 请求出库 50，但只有 20
          remark: '库存不足测试',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('库存不足');
      expect(response.body.message).toContain('当前库存: 20');
      expect(response.body.message).toContain('请求出库: 50');

      // 验证库存没有变化
      const prisma = getTestPrisma();
      const unchangedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(unchangedProduct?.quantity).toBe(20);

      // 验证没有生成交易记录
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });
      expect(transaction).toBeNull();
    });

    /**
     * **Validates: FR-OUT-001 AC4**
     * 测试零库存商品出库时应返回错误
     */
    it('零库存商品出库时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_ZERO_STOCK`,
        `${TEST_PREFIX}零库存测试商品`,
        testCategoryId,
        0
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 1,
          remark: '零库存出库测试',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('库存不足');
    });

    /**
     * **Validates: FR-OUT-001 AC5**
     * 测试备注信息记录
     */
    it('应该正确记录备注信息', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_REMARK`,
        `${TEST_PREFIX}备注测试商品`,
        testCategoryId,
        100
      );

      const remarkText = '这是一条出库备注信息';
      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 20,
          remark: remarkText,
        });

      expect(response.status).toBe(201);

      // 验证交易记录中包含备注信息
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });
      expect(transaction?.remark).toBe(remarkText);
    });

    /**
     * **Validates: FR-OUT-001 AC7**
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
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 40,
          remark: '审计日志测试',
        });

      // 验证审计日志（inventory_transactions 表）已创建
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });

      expect(transaction).not.toBeNull();
      expect(transaction?.type).toBe('OUT');
      expect(transaction?.operatorId).toBe(testUser.id);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(60);
      expect(transaction?.createdAt).toBeDefined();
    });

    /**
     * **Validates: FR-OUT-001 AC1**
     * 测试商品不存在时的错误处理
     */
    it('商品不存在时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: 'NONEXISTENT_SKU',
          quantity: 10,
          remark: '不存在的商品',
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('商品不存在');
    });

    /**
     * **Validates: FR-OUT-001 AC2**
     * 测试出库数量为零时的错误处理
     */
    it('出库数量为零时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_ZERO_QTY`,
        `${TEST_PREFIX}零数量测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('出库数量必须为正整数');
    });

    /**
     * **Validates: FR-OUT-001 AC2**
     * 测试出库数量为负数时的错误处理
     */
    it('出库数量为负数时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_NEG_QTY`,
        `${TEST_PREFIX}负数量测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: -10,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('出库数量必须为正整数');
    });

    /**
     * **Validates: FR-OUT-001 AC2**
     * 测试出库数量为小数时的错误处理
     */
    it('出库数量为小数时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_DECIMAL`,
        `${TEST_PREFIX}小数测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 10.5,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('出库数量必须为整数');
    });

    /**
     * 测试 SKU 为空时的错误处理
     */
    it('SKU 为空时应返回错误', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: '',
          quantity: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('SKU 不能为空');
    });

    /**
     * 测试出库数量为空时的错误处理
     */
    it('出库数量为空时应返回错误', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_EMPTY_QTY`,
        `${TEST_PREFIX}空数量测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('出库数量不能为空');
    });

    /**
     * 测试不带备注的出库
     */
    it('不带备注时应该成功出库', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}SKU_NO_REMARK`,
        `${TEST_PREFIX}无备注测试商品`,
        testCategoryId,
        100
      );

      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 25,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.quantityAfter).toBe(75);

      // 验证交易记录中备注为空
      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });
      expect(transaction?.remark).toBeNull();
    });

    /**
     * 测试未认证时的错误处理
     */
    it('未认证时应返回 401', async () => {
      const response = await request(app)
        .post('/api/v1/inventory/outbound')
        .send({
          sku: 'TEST_SKU',
          quantity: 10,
        });

      expect(response.status).toBe(401);
    });
  });

  /**
   * FR-OUT-002: 出库记录查看
   * AC1: 显示出库记录列表，包含出库时间、SKU、商品名称、数量、操作人、备注
   * AC2: 支持按时间范围筛选
   * AC3: 支持按SKU搜索
   * AC4: 支持分页显示
   */
  describe('GET /api/v1/inventory/outbound/records - 出库记录查询 (FR-OUT-002)', () => {
    let recordProduct: { id: number; sku: string; name: string; categoryId: number; quantity: number; version: number; minThreshold: number };

    beforeEach(async () => {
      // 创建测试商品并执行出库
      recordProduct = await createTestProduct(
        `${TEST_PREFIX}RECORD001`,
        `${TEST_PREFIX}记录测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: recordProduct.sku,
          quantity: 25,
          remark: '测试出库记录',
        });
    });

    /**
     * **Validates: FR-OUT-002 AC1**
     * 测试返回出库记录列表
     */
    it('应该返回出库记录列表', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/outbound/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.code).toBe(200);
      expect(response.body.data.list).toBeDefined();
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);

      const record = response.body.data.list.find(
        (r: { sku: string }) => r.sku === recordProduct.sku
      );
      expect(record).toBeDefined();
      expect(record.type).toBe('OUT');
      expect(record.quantity).toBe(25);
    });

    /**
     * **Validates: FR-OUT-002 AC1**
     * 测试出库记录包含所有必要字段
     */
    it('出库记录应包含所有必要字段', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/outbound/records')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const record = response.body.data.list.find(
        (r: { sku: string }) => r.sku === recordProduct.sku
      );

      // 验证必要字段
      expect(record.id).toBeDefined();
      expect(record.type).toBe('OUT');
      expect(record.sku).toBe(recordProduct.sku);
      expect(record.quantity).toBe(25);
      expect(record.quantityBefore).toBe(100);
      expect(record.quantityAfter).toBe(75);
      expect(record.operatorId).toBe(testUser.id);
      expect(record.remark).toBe('测试出库记录');
      expect(record.createdAt).toBeDefined();
    });

    /**
     * **Validates: FR-OUT-002 AC4**
     * 测试分页功能
     */
    it('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/outbound/records?page=1&pageSize=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(5);
      expect(response.body.data.total).toBeDefined();
      expect(response.body.data.list.length).toBeLessThanOrEqual(5);
    });

    /**
     * **Validates: FR-OUT-002 AC3**
     * 测试按 SKU 搜索
     */
    it('应该支持按 SKU 搜索', async () => {
      // 创建另一个商品并出库
      const anotherProduct = await createTestProduct(
        `${TEST_PREFIX}RECORD_SEARCH`,
        `${TEST_PREFIX}搜索测试商品`,
        testCategoryId,
        50
      );

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: anotherProduct.sku,
          quantity: 15,
        });

      // 按 SKU 搜索
      const response = await request(app)
        .get(`/api/v1/inventory/outbound/records?sku=${anotherProduct.sku}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.list.length).toBeGreaterThanOrEqual(1);
      
      // 验证所有返回的记录都匹配搜索的 SKU
      response.body.data.list.forEach((record: { sku: string }) => {
        expect(record.sku).toBe(anotherProduct.sku);
      });
    });

    /**
     * **Validates: FR-OUT-002 AC2**
     * 测试按时间范围筛选
     */
    it('应该支持按时间范围筛选', async () => {
      // 获取今天的日期范围
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const response = await request(app)
        .get(`/api/v1/inventory/outbound/records?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
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
        .get('/api/v1/inventory/outbound/records?startDate=invalid-date')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('时间格式无效');
    });

    /**
     * 测试未认证时的错误处理
     */
    it('未认证时应返回 401', async () => {
      const response = await request(app)
        .get('/api/v1/inventory/outbound/records');

      expect(response.status).toBe(401);
    });
  });

  /**
   * 库存数量更新测试
   */
  describe('库存数量更新测试', () => {
    /**
     * 测试出库后库存正确减少
     */
    it('出库后库存应该正确减少', async () => {
      const initialQuantity = 100;
      const outboundQuantity = 30;

      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_UPDATE`,
        `${TEST_PREFIX}库存更新测试商品`,
        testCategoryId,
        initialQuantity
      );

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: outboundQuantity,
        });

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      expect(updatedProduct?.quantity).toBe(initialQuantity - outboundQuantity);
    });

    /**
     * 测试多次出库后库存累计正确
     */
    it('多次出库后库存应该累计正确', async () => {
      const initialQuantity = 100;
      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_MULTI`,
        `${TEST_PREFIX}多次出库测试商品`,
        testCategoryId,
        initialQuantity
      );

      // 第一次出库
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 20,
        });

      // 第二次出库
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
        });

      // 第三次出库
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 10,
        });

      const prisma = getTestPrisma();
      const updatedProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });

      // 100 - 20 - 30 - 10 = 40
      expect(updatedProduct?.quantity).toBe(40);
    });

    /**
     * 测试多次出库后库存不足时应拒绝
     */
    it('多次出库后库存不足时应拒绝', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}STOCK_EXHAUST`,
        `${TEST_PREFIX}库存耗尽测试商品`,
        testCategoryId,
        50
      );

      // 第一次出库成功
      const response1 = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
        });
      expect(response1.status).toBe(201);

      // 第二次出库成功
      const response2 = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 15,
        });
      expect(response2.status).toBe(201);

      // 第三次出库失败（库存只剩 5）
      const response3 = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 10,
        });
      expect(response3.status).toBe(400);
      expect(response3.body.message).toContain('库存不足');

      // 验证库存保持在 5
      const prisma = getTestPrisma();
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.quantity).toBe(5);
    });
  });

  /**
   * 完整入库-出库流程测试
   */
  describe('完整入库-出库流程测试', () => {
    /**
     * 测试入库后出库的完整流程
     */
    it('应该正确执行入库后出库的完整流程', async () => {
      const prisma = getTestPrisma();

      // 1. 创建商品（初始库存 0）
      const product = await createTestProduct(
        `${TEST_PREFIX}FLOW001`,
        `${TEST_PREFIX}流程测试商品`,
        testCategoryId,
        0
      );

      // 2. 入库 100 个
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
      expect(inboundResponse.body.data.quantityAfter).toBe(100);

      // 3. 出库 30 个
      const outboundResponse1 = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
          remark: '第一次出库',
        });

      expect(outboundResponse1.status).toBe(201);
      expect(outboundResponse1.body.data.quantityBefore).toBe(100);
      expect(outboundResponse1.body.data.quantityAfter).toBe(70);

      // 4. 再出库 50 个
      const outboundResponse2 = await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50,
          remark: '第二次出库',
        });

      expect(outboundResponse2.status).toBe(201);
      expect(outboundResponse2.body.data.quantityBefore).toBe(70);
      expect(outboundResponse2.body.data.quantityAfter).toBe(20);

      // 5. 验证最终库存
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.quantity).toBe(20);

      // 6. 验证交易记录数量
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { sku: product.sku },
        orderBy: { createdAt: 'asc' },
      });
      expect(transactions).toHaveLength(3);
      expect(transactions[0].type).toBe('IN');
      expect(transactions[1].type).toBe('OUT');
      expect(transactions[2].type).toBe('OUT');
    });

    /**
     * 测试入库-出库-入库的循环流程
     */
    it('应该正确执行入库-出库-入库的循环流程', async () => {
      const prisma = getTestPrisma();

      const product = await createTestProduct(
        `${TEST_PREFIX}FLOW002`,
        `${TEST_PREFIX}循环流程测试商品`,
        testCategoryId,
        50
      );

      // 入库 30
      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 30,
          supplierId: testSupplierId,
        });

      // 出库 40
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 40,
        });

      // 再入库 20
      await request(app)
        .post('/api/v1/inventory/inbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 20,
          supplierId: testSupplierId,
        });

      // 验证最终库存：50 + 30 - 40 + 20 = 60
      const finalProduct = await prisma.product.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.quantity).toBe(60);

      // 验证交易记录
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { sku: product.sku },
        orderBy: { createdAt: 'asc' },
      });
      expect(transactions).toHaveLength(3);
      expect(transactions[0].type).toBe('IN');
      expect(transactions[0].quantityAfter).toBe(80);
      expect(transactions[1].type).toBe('OUT');
      expect(transactions[1].quantityAfter).toBe(40);
      expect(transactions[2].type).toBe('IN');
      expect(transactions[2].quantityAfter).toBe(60);
    });
  });

  /**
   * 审计日志生成测试
   */
  describe('审计日志生成测试', () => {
    /**
     * 测试出库操作生成完整的审计日志
     */
    it('出库操作应生成完整的审计日志', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT001`,
        `${TEST_PREFIX}审计日志测试商品`,
        testCategoryId,
        100
      );

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 35,
          remark: '审计日志完整性测试',
        });

      const prisma = getTestPrisma();
      const transaction = await prisma.inventoryTransaction.findFirst({
        where: { sku: product.sku, type: 'OUT' },
      });

      // 验证审计日志的完整性
      expect(transaction).not.toBeNull();
      expect(transaction?.id).toBeDefined();
      expect(transaction?.type).toBe('OUT');
      expect(transaction?.productId).toBe(product.id);
      expect(transaction?.sku).toBe(product.sku);
      expect(transaction?.quantity).toBe(35);
      expect(transaction?.quantityBefore).toBe(100);
      expect(transaction?.quantityAfter).toBe(65);
      expect(transaction?.supplierId).toBeNull(); // 出库没有供应商
      expect(transaction?.operatorId).toBe(testUser.id);
      expect(transaction?.remark).toBe('审计日志完整性测试');
      expect(transaction?.createdAt).toBeDefined();
    });

    /**
     * 测试多次出库生成多条审计日志
     */
    it('多次出库应生成多条独立的审计日志', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT002`,
        `${TEST_PREFIX}多次审计日志测试商品`,
        testCategoryId,
        100
      );

      // 执行三次出库
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sku: product.sku, quantity: 10, remark: '第一次出库' });

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sku: product.sku, quantity: 20, remark: '第二次出库' });

      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sku: product.sku, quantity: 15, remark: '第三次出库' });

      const prisma = getTestPrisma();
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { sku: product.sku, type: 'OUT' },
        orderBy: { createdAt: 'asc' },
      });

      expect(transactions).toHaveLength(3);
      
      // 验证每条记录的库存变化链
      expect(transactions[0].quantityBefore).toBe(100);
      expect(transactions[0].quantityAfter).toBe(90);
      expect(transactions[0].remark).toBe('第一次出库');

      expect(transactions[1].quantityBefore).toBe(90);
      expect(transactions[1].quantityAfter).toBe(70);
      expect(transactions[1].remark).toBe('第二次出库');

      expect(transactions[2].quantityBefore).toBe(70);
      expect(transactions[2].quantityAfter).toBe(55);
      expect(transactions[2].remark).toBe('第三次出库');
    });

    /**
     * 测试出库失败时不生成审计日志
     */
    it('出库失败时不应生成审计日志', async () => {
      const product = await createTestProduct(
        `${TEST_PREFIX}AUDIT003`,
        `${TEST_PREFIX}失败审计日志测试商品`,
        testCategoryId,
        10
      );

      // 尝试出库超过库存的数量
      await request(app)
        .post('/api/v1/inventory/outbound')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sku: product.sku,
          quantity: 50,
          remark: '应该失败的出库',
        });

      const prisma = getTestPrisma();
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { sku: product.sku, type: 'OUT' },
      });

      expect(transactions).toHaveLength(0);
    });
  });
});
