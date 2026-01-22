/**
 * Product 实体单元测试
 * 测试商品实体的业务方法
 */

import { describe, it, expect } from 'vitest';
import { Product } from './Product';
import { ProductData } from '../../../../shared/mappers/ProductMapper';

describe('Product Entity', () => {
  // 创建测试用的 ProductData
  const createTestProductData = (overrides: Partial<ProductData> = {}): ProductData => ({
    id: 1,
    sku: 'TEST-001',
    name: '测试商品',
    categoryId: 1,
    unit: '个',
    quantity: 100,
    minThreshold: 10,
    costPrice: 50.00,
    salePrice: 100.00,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  describe('reconstruct', () => {
    it('应该从 ProductData 正确重建 Product 实体', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      expect(product.getId()).toBe(data.id);
      expect(product.getSku()).toBe(data.sku);
      expect(product.getName()).toBe(data.name);
      expect(product.getCategoryId()).toBe(data.categoryId);
      expect(product.getUnit()).toBe(data.unit);
      expect(product.getQuantity()).toBe(data.quantity);
      expect(product.getMinThreshold()).toBe(data.minThreshold);
      expect(product.getCostPrice()).toBe(data.costPrice);
      expect(product.getSalePrice()).toBe(data.salePrice);
      expect(product.getVersion()).toBe(data.version);
    });

    it('应该正确处理 null 价格', () => {
      const data = createTestProductData({ costPrice: null, salePrice: null });
      const product = Product.reconstruct(data);

      expect(product.getCostPrice()).toBeNull();
      expect(product.getSalePrice()).toBeNull();
    });
  });

  describe('create', () => {
    it('应该使用默认值创建新商品', () => {
      const product = Product.create({
        sku: 'NEW-001',
        name: '新商品',
        categoryId: 1,
        unit: '个',
      });

      expect(product.getId()).toBe(0);
      expect(product.getSku()).toBe('NEW-001');
      expect(product.getName()).toBe('新商品');
      expect(product.getQuantity()).toBe(0);
      expect(product.getMinThreshold()).toBe(10);
      expect(product.getCostPrice()).toBeNull();
      expect(product.getSalePrice()).toBeNull();
      expect(product.getVersion()).toBe(1);
    });

    it('应该使用自定义值创建新商品', () => {
      const product = Product.create({
        sku: 'NEW-002',
        name: '新商品2',
        categoryId: 2,
        unit: '箱',
        quantity: 50,
        minThreshold: 5,
        costPrice: 100,
        salePrice: 200,
      });

      expect(product.getQuantity()).toBe(50);
      expect(product.getMinThreshold()).toBe(5);
      expect(product.getCostPrice()).toBe(100);
      expect(product.getSalePrice()).toBe(200);
    });
  });

  describe('isLowStock', () => {
    it('当库存等于预警阈值时应返回 true', () => {
      const data = createTestProductData({ quantity: 10, minThreshold: 10 });
      const product = Product.reconstruct(data);

      expect(product.isLowStock()).toBe(true);
    });

    it('当库存小于预警阈值时应返回 true', () => {
      const data = createTestProductData({ quantity: 5, minThreshold: 10 });
      const product = Product.reconstruct(data);

      expect(product.isLowStock()).toBe(true);
    });

    it('当库存大于预警阈值时应返回 false', () => {
      const data = createTestProductData({ quantity: 15, minThreshold: 10 });
      const product = Product.reconstruct(data);

      expect(product.isLowStock()).toBe(false);
    });

    it('当库存为0时应返回 true', () => {
      const data = createTestProductData({ quantity: 0, minThreshold: 10 });
      const product = Product.reconstruct(data);

      expect(product.isLowStock()).toBe(true);
    });
  });

  describe('canOutbound', () => {
    it('当库存足够时应返回 true', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(product.canOutbound(50)).toBe(true);
      expect(product.canOutbound(100)).toBe(true);
    });

    it('当库存不足时应返回 false', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(product.canOutbound(101)).toBe(false);
      expect(product.canOutbound(200)).toBe(false);
    });

    it('当库存为0时应返回 false', () => {
      const data = createTestProductData({ quantity: 0 });
      const product = Product.reconstruct(data);

      expect(product.canOutbound(1)).toBe(false);
    });
  });

  describe('adjustStock', () => {
    it('应该正确增加库存', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      product.adjustStock(50);

      expect(product.getQuantity()).toBe(150);
    });

    it('应该正确减少库存', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      product.adjustStock(-30);

      expect(product.getQuantity()).toBe(70);
    });

    it('当库存不足时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.adjustStock(-101)).toThrow('库存不足');
    });

    it('应该允许库存减少到0', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      product.adjustStock(-100);

      expect(product.getQuantity()).toBe(0);
    });
  });

  describe('inbound', () => {
    it('应该正确执行入库操作并返回变更结果', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      const result = product.inbound(50);

      expect(result.before).toBe(100);
      expect(result.after).toBe(150);
      expect(product.getQuantity()).toBe(150);
    });

    it('当入库数量为0时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.inbound(0)).toThrow('入库数量必须为正整数');
    });

    it('当入库数量为负数时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.inbound(-10)).toThrow('入库数量必须为正整数');
    });

    it('当入库数量为小数时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.inbound(10.5)).toThrow('入库数量必须为整数');
    });
  });

  describe('outbound', () => {
    it('应该正确执行出库操作并返回变更结果', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      const result = product.outbound(30);

      expect(result.before).toBe(100);
      expect(result.after).toBe(70);
      expect(product.getQuantity()).toBe(70);
    });

    it('当出库数量为0时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.outbound(0)).toThrow('出库数量必须为正整数');
    });

    it('当出库数量为负数时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.outbound(-10)).toThrow('出库数量必须为正整数');
    });

    it('当出库数量为小数时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.outbound(10.5)).toThrow('出库数量必须为整数');
    });

    it('当库存不足时应抛出错误', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(() => product.outbound(101)).toThrow('库存不足，无法出库');
    });

    it('应该允许出库全部库存', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      const result = product.outbound(100);

      expect(result.before).toBe(100);
      expect(result.after).toBe(0);
      expect(product.getQuantity()).toBe(0);
    });
  });

  describe('setters', () => {
    it('setMinThreshold 应该正确设置预警阈值', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      product.setMinThreshold(20);

      expect(product.getMinThreshold()).toBe(20);
    });

    it('setMinThreshold 当值为负数时应抛出错误', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      expect(() => product.setMinThreshold(-1)).toThrow('预警阈值不能为负数');
    });

    it('setCostPrice 应该正确设置成本价', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      product.setCostPrice(80);

      expect(product.getCostPrice()).toBe(80);
    });

    it('setCostPrice 当值为负数时应抛出错误', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      expect(() => product.setCostPrice(-10)).toThrow('成本价不能为负数');
    });

    it('setSalePrice 应该正确设置售价', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      product.setSalePrice(150);

      expect(product.getSalePrice()).toBe(150);
    });

    it('setSalePrice 当值为负数时应抛出错误', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      expect(() => product.setSalePrice(-10)).toThrow('售价不能为负数');
    });
  });

  describe('softDelete', () => {
    it('应该正确执行软删除', () => {
      const data = createTestProductData();
      const product = Product.reconstruct(data);

      expect(product.isDeleted()).toBe(false);

      product.softDelete();

      expect(product.isDeleted()).toBe(true);
      expect(product.getDeletedAt()).not.toBeNull();
    });
  });

  describe('hasStock', () => {
    it('当库存大于0时应返回 true', () => {
      const data = createTestProductData({ quantity: 100 });
      const product = Product.reconstruct(data);

      expect(product.hasStock()).toBe(true);
    });

    it('当库存为0时应返回 false', () => {
      const data = createTestProductData({ quantity: 0 });
      const product = Product.reconstruct(data);

      expect(product.hasStock()).toBe(false);
    });
  });

  describe('toData', () => {
    it('应该正确转换为 ProductData', () => {
      const originalData = createTestProductData();
      const product = Product.reconstruct(originalData);

      const data = product.toData();

      expect(data.id).toBe(originalData.id);
      expect(data.sku).toBe(originalData.sku);
      expect(data.name).toBe(originalData.name);
      expect(data.categoryId).toBe(originalData.categoryId);
      expect(data.unit).toBe(originalData.unit);
      expect(data.quantity).toBe(originalData.quantity);
      expect(data.minThreshold).toBe(originalData.minThreshold);
      expect(data.costPrice).toBe(originalData.costPrice);
      expect(data.salePrice).toBe(originalData.salePrice);
      expect(data.version).toBe(originalData.version);
    });
  });
});
