/**
 * 供应商服务
 * 处理供应商相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client';
import {
  Supplier,
  SupplierDTO,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierQueryParams,
  toSupplierDTO,
} from './supplier.model';
import { PaginationUtil, PaginationResult } from '../../shared/utils/pagination';

/**
 * 供应商服务类
 */
export class SupplierService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取供应商列表（分页）
   * @param params 查询参数
   * @returns 分页结果
   */
  async findAll(params: SupplierQueryParams): Promise<PaginationResult<SupplierDTO>> {
    const paginationParams = PaginationUtil.parseParams(params.page, params.pageSize);
    const { skip, take } = PaginationUtil.toQuery(paginationParams);

    // 构建查询条件
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // 关键字搜索（名称或编码）
    if (params.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { code: { contains: params.keyword } },
      ];
    }

    // 查询供应商列表和总数
    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    // 转换为 DTO
    const supplierDTOs = suppliers.map((supplier) => toSupplierDTO(supplier as Supplier));

    return PaginationUtil.createResult(supplierDTOs, total, paginationParams);
  }

  /**
   * 获取供应商详情
   * @param id 供应商 ID
   * @returns 供应商 DTO
   */
  async findById(id: number): Promise<SupplierDTO> {
    const supplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!supplier) {
      throw new Error('供应商不存在');
    }

    return toSupplierDTO(supplier as Supplier);
  }

  /**
   * 创建供应商
   * @param createDTO 创建供应商信息
   * @returns 供应商 DTO
   */
  async create(createDTO: CreateSupplierDTO): Promise<SupplierDTO> {
    const { code, name, contact, phone, address } = createDTO;

    // 检查供应商编码是否已存在
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        code,
        deletedAt: null,
      },
    });

    if (existingSupplier) {
      throw new Error('供应商编码已存在');
    }

    // 创建供应商
    const supplier = await this.prisma.supplier.create({
      data: {
        code,
        name,
        contact: contact || null,
        phone: phone || null,
        address: address || null,
      },
    });

    return toSupplierDTO(supplier as Supplier);
  }

  /**
   * 更新供应商
   * @param id 供应商 ID
   * @param updateDTO 更新信息
   * @returns 供应商 DTO
   */
  async update(id: number, updateDTO: UpdateSupplierDTO): Promise<SupplierDTO> {
    // 检查供应商是否存在
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingSupplier) {
      throw new Error('供应商不存在');
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};

    if (updateDTO.name !== undefined) {
      updateData.name = updateDTO.name;
    }

    if (updateDTO.contact !== undefined) {
      updateData.contact = updateDTO.contact;
    }

    if (updateDTO.phone !== undefined) {
      updateData.phone = updateDTO.phone;
    }

    if (updateDTO.address !== undefined) {
      updateData.address = updateDTO.address;
    }

    // 更新供应商
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    return toSupplierDTO(supplier as Supplier);
  }

  /**
   * 删除供应商（软删除）
   * @param id 供应商 ID
   */
  async delete(id: number): Promise<void> {
    // 检查供应商是否存在
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingSupplier) {
      throw new Error('供应商不存在');
    }

    // 检查是否有关联的入库记录
    const transactionCount = await this.prisma.inventoryTransaction.count({
      where: {
        supplierId: id,
      },
    });

    if (transactionCount > 0) {
      throw new Error('该供应商有关联的入库记录，无法删除');
    }

    // 软删除供应商
    await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export default SupplierService;
