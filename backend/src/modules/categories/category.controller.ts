/**
 * 商品分类控制器
 * 处理分类相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { CategoryService } from './category.service';
import { ResponseUtil } from '../../shared/utils/response';
import {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from './category.model';

/**
 * 分类控制器类
 */
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  /**
   * 获取分类树
   * GET /api/v1/categories
   */
  getCategoryTree = async (_req: Request, res: Response): Promise<void> => {
    try {
      const tree = await this.categoryService.getCategoryTree();
      ResponseUtil.success(res, tree, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取分类树失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 获取分类详情
   * GET /api/v1/categories/:id
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的分类 ID');
        return;
      }

      const category = await this.categoryService.findById(id);
      ResponseUtil.success(res, category, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取分类详情失败';
      if (message === '分类不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 创建分类
   * POST /api/v1/categories
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const createDTO: CreateCategoryDTO = req.body;

      // 验证必填字段
      if (!createDTO.name) {
        ResponseUtil.error(res, '分类名称不能为空');
        return;
      }

      // 验证分类名称长度
      if (createDTO.name.length > 100) {
        ResponseUtil.error(res, '分类名称长度不能超过100个字符');
        return;
      }

      // 验证父分类 ID（如果提供）
      if (createDTO.parentId !== undefined && createDTO.parentId !== null) {
        if (typeof createDTO.parentId !== 'number' || isNaN(createDTO.parentId)) {
          ResponseUtil.error(res, '无效的父分类 ID');
          return;
        }
      }

      const category = await this.categoryService.create(createDTO);
      ResponseUtil.created(res, category, '创建成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建分类失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 更新分类
   * PUT /api/v1/categories/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的分类 ID');
        return;
      }

      const updateDTO: UpdateCategoryDTO = req.body;

      // 验证分类名称长度（如果提供）
      if (updateDTO.name !== undefined) {
        if (!updateDTO.name) {
          ResponseUtil.error(res, '分类名称不能为空');
          return;
        }
        if (updateDTO.name.length > 100) {
          ResponseUtil.error(res, '分类名称长度不能超过100个字符');
          return;
        }
      }

      // 验证父分类 ID（如果提供）
      if (updateDTO.parentId !== undefined && updateDTO.parentId !== null) {
        if (typeof updateDTO.parentId !== 'number' || isNaN(updateDTO.parentId)) {
          ResponseUtil.error(res, '无效的父分类 ID');
          return;
        }
      }

      const category = await this.categoryService.update(id, updateDTO);
      ResponseUtil.success(res, category, '更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新分类失败';
      if (message === '分类不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 删除分类（软删除）
   * DELETE /api/v1/categories/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的分类 ID');
        return;
      }

      await this.categoryService.delete(id);
      ResponseUtil.success(res, null, '删除成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除分类失败';
      if (message === '分类不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };
}

export default CategoryController;
