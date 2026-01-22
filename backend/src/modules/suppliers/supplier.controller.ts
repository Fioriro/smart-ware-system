/**
 * 供应商控制器
 * 处理供应商相关的 HTTP 请求
 */

import { Request, Response } from 'express';
import { SupplierService } from './supplier.service';
import { ResponseUtil } from '../../shared/utils/response';
import {
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierQueryParams,
} from './supplier.model';

/**
 * 供应商控制器类
 */
export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  /**
   * 获取供应商列表
   * GET /api/v1/suppliers
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: SupplierQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
        keyword: req.query.keyword as string | undefined,
      };

      const result = await this.supplierService.findAll(params);
      ResponseUtil.paginated(
        res,
        result.list,
        result.total,
        result.page,
        result.pageSize,
        '获取成功'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取供应商列表失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 获取供应商详情
   * GET /api/v1/suppliers/:id
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的供应商 ID');
        return;
      }

      const supplier = await this.supplierService.findById(id);
      ResponseUtil.success(res, supplier, '获取成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取供应商详情失败';
      if (message === '供应商不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 创建供应商
   * POST /api/v1/suppliers
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const createDTO: CreateSupplierDTO = req.body;

      // 验证必填字段
      if (!createDTO.code) {
        ResponseUtil.error(res, '供应商编码不能为空');
        return;
      }

      if (!createDTO.name) {
        ResponseUtil.error(res, '供应商名称不能为空');
        return;
      }

      // 验证编码长度
      if (createDTO.code.length > 50) {
        ResponseUtil.error(res, '供应商编码长度不能超过50个字符');
        return;
      }

      // 验证名称长度
      if (createDTO.name.length > 200) {
        ResponseUtil.error(res, '供应商名称长度不能超过200个字符');
        return;
      }

      // 验证联系人长度（如果提供）
      if (createDTO.contact && createDTO.contact.length > 100) {
        ResponseUtil.error(res, '联系人长度不能超过100个字符');
        return;
      }

      // 验证电话长度（如果提供）
      if (createDTO.phone && createDTO.phone.length > 20) {
        ResponseUtil.error(res, '联系电话长度不能超过20个字符');
        return;
      }

      // 验证地址长度（如果提供）
      if (createDTO.address && createDTO.address.length > 500) {
        ResponseUtil.error(res, '地址长度不能超过500个字符');
        return;
      }

      const supplier = await this.supplierService.create(createDTO);
      ResponseUtil.created(res, supplier, '创建成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建供应商失败';
      ResponseUtil.error(res, message);
    }
  };

  /**
   * 更新供应商
   * PUT /api/v1/suppliers/:id
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的供应商 ID');
        return;
      }

      const updateDTO: UpdateSupplierDTO = req.body;

      // 验证名称长度（如果提供）
      if (updateDTO.name !== undefined) {
        if (!updateDTO.name) {
          ResponseUtil.error(res, '供应商名称不能为空');
          return;
        }
        if (updateDTO.name.length > 200) {
          ResponseUtil.error(res, '供应商名称长度不能超过200个字符');
          return;
        }
      }

      // 验证联系人长度（如果提供）
      if (updateDTO.contact !== undefined && updateDTO.contact !== null && updateDTO.contact.length > 100) {
        ResponseUtil.error(res, '联系人长度不能超过100个字符');
        return;
      }

      // 验证电话长度（如果提供）
      if (updateDTO.phone !== undefined && updateDTO.phone !== null && updateDTO.phone.length > 20) {
        ResponseUtil.error(res, '联系电话长度不能超过20个字符');
        return;
      }

      // 验证地址长度（如果提供）
      if (updateDTO.address !== undefined && updateDTO.address !== null && updateDTO.address.length > 500) {
        ResponseUtil.error(res, '地址长度不能超过500个字符');
        return;
      }

      const supplier = await this.supplierService.update(id, updateDTO);
      ResponseUtil.success(res, supplier, '更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新供应商失败';
      if (message === '供应商不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };

  /**
   * 删除供应商（软删除）
   * DELETE /api/v1/suppliers/:id
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        ResponseUtil.error(res, '无效的供应商 ID');
        return;
      }

      await this.supplierService.delete(id);
      ResponseUtil.success(res, null, '删除成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除供应商失败';
      if (message === '供应商不存在') {
        ResponseUtil.notFound(res, message);
      } else {
        ResponseUtil.error(res, message);
      }
    }
  };
}

export default SupplierController;
