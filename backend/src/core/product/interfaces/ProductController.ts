/**
 * ProductController
 * 商品管理 HTTP 请求处理
 */

import { Request, Response } from 'express';
import { ProductService, CreateProductDTO, UpdateProductDTO } from '../application/ProductService';
import { ProductQueryParams } from '../domain/repositories/IProductRepository';
import { ResponseUtil } from '../../../shared/utils/response';

/**
 * 商品控制器类
 */
export class ProductController {
  constructor(private productService: ProductService) {}

  /**
   * 获取商品列表
   * GET /api/v1/products
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: ProductQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        keyword: req.query.keyword as string | undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined,
        lowStockOnly: req.query.lowStockOnly === 'true',
      };

      const result = await this.productService.findAll(params);
      ResponseUtil.paginated(
        res,
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取成功'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取商品列表失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 获取商品详情
   * GET /api/v1/products/:id
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的商品 ID');
        return;
      }

      const product = await this.productService.findById(id);
      ResponseUtil.success(res, product, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取商品详情失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 根据 SKU 查询商品
   * GET /api/v1/products/sku/:sku
   */
  findBySku = async (req: Request, res: Response): Promise<void> => {
    try {
      const sku = req.params.sku;

      if (!sku) {
        ResponseUtil.error(res, 'SKU 不能为空');
        return;
      }

      const product = await this.productService.findBySku(sku);
      ResponseUtil.success(res, product, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取商品详情失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 获取低库存商品列表
   * GET /api/v1/products/low-stock
   */
  findLowStock = async (_req: Request, res: Response): Promise<void> => {
    try {
      const products = await this.productService.findLowStock();
      ResponseUtil.success(res, products, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取低库存商品列表失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 创建商品
   * POST /api/v1/products
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const createDTO: CreateProductDTO = req.body;

      // 验证必填字段
      if (!createDTO.sku) {
        ResponseUtil.error(res, 'SKU 不能为空');
        return;
      }

      if (!createDTO.name) {
        ResponseUtil.error(res, '商品名称不能为空');
        return;
      }

      if (!createDTO.categoryId) {
        ResponseUtil.error(res, '分类不能为空');
        return;
      }

      if (!createDTO.unit) {
        ResponseUtil.error(res, '单位不能为空');
        return;
      }

      // 验证字段长度
      if (createDTO.sku.length > 50) {
        ResponseUtil.error(res, 'SKU 长度不能超过50个字符');
        return;
      }

      if (createDTO.name.length > 200) {
        ResponseUtil.error(res, '商品名称长度不能超过200个字符');
        return;
      }

      if (createDTO.unit.length > 20) {
        ResponseUtil.error(res, '单位长度不能超过20个字符');
        return;
      }

      // 验证数值
      if (createDTO.quantity !== undefined && createDTO.quantity < 0) {
        ResponseUtil.error(res, '库存数量不能为负数');
        return;
      }

      if (createDTO.minThreshold !== undefined && createDTO.minThreshold < 0) {
        ResponseUtil.error(res, '预警阈值不能为负数');
        return;
      }

      if (createDTO.costPrice !== undefined && createDTO.costPrice !== null && createDTO.costPrice < 0) {
        ResponseUtil.error(res, '成本价不能为负数');
        return;
      }

      if (createDTO.salePrice !== undefined && createDTO.salePrice !== null && createDTO.salePrice < 0) {
        ResponseUtil.error(res, '售价不能为负数');
        return;
      }

      const product = await this.productService.create(createDTO);
      ResponseUtil.created(res, product, '创建成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建商品失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 更新商品
   * PUT /api/v1/products/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的商品 ID');
        return;
      }

      const updateDTO: UpdateProductDTO = req.body;

      // 验证字段长度（如果提供）
      if (updateDTO.name !== undefined) {
        if (!updateDTO.name) {
          ResponseUtil.error(res, '商品名称不能为空');
          return;
        }
        if (updateDTO.name.length > 200) {
          ResponseUtil.error(res, '商品名称长度不能超过200个字符');
          return;
        }
      }

      if (updateDTO.unit !== undefined) {
        if (!updateDTO.unit) {
          ResponseUtil.error(res, '单位不能为空');
          return;
        }
        if (updateDTO.unit.length > 20) {
          ResponseUtil.error(res, '单位长度不能超过20个字符');
          return;
        }
      }

      // 验证数值
      if (updateDTO.minThreshold !== undefined && updateDTO.minThreshold < 0) {
        ResponseUtil.error(res, '预警阈值不能为负数');
        return;
      }

      if (updateDTO.costPrice !== undefined && updateDTO.costPrice !== null && updateDTO.costPrice < 0) {
        ResponseUtil.error(res, '成本价不能为负数');
        return;
      }

      if (updateDTO.salePrice !== undefined && updateDTO.salePrice !== null && updateDTO.salePrice < 0) {
        ResponseUtil.error(res, '售价不能为负数');
        return;
      }

      const product = await this.productService.update(id, updateDTO);
      ResponseUtil.success(res, product, '更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新商品失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else if (message === '并发冲突，请重试') {
        ResponseUtil.error(res, message, 409);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 删除商品（软删除）
   * DELETE /api/v1/products/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的商品 ID');
        return;
      }

      const result = await this.productService.delete(id);
      
      // 如果商品有库存，返回警告信息
      if (result.hasStock) {
        ResponseUtil.success(res, { warning: '该商品有库存，已删除' }, '删除成功');
      } else {
        ResponseUtil.success(res, null, '删除成功');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除商品失败';
      if (message === '商品不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };
}

export default ProductController;
