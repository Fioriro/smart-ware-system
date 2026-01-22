/**
 * 供应商模型
 * 定义供应商相关的类型和接口
 */

/**
 * 供应商实体接口
 */
export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * 供应商响应 DTO
 */
export interface SupplierDTO {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建供应商请求 DTO
 */
export interface CreateSupplierDTO {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
}

/**
 * 更新供应商请求 DTO
 * 注意：code 字段为只读，不可修改
 */
export interface UpdateSupplierDTO {
  name?: string;
  contact?: string | null;
  phone?: string | null;
  address?: string | null;
}

/**
 * 供应商查询参数
 */
export interface SupplierQueryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

/**
 * 将供应商实体转换为 DTO
 * @param supplier 供应商实体
 * @returns 供应商 DTO
 */
export const toSupplierDTO = (supplier: Supplier): SupplierDTO => {
  return {
    id: supplier.id,
    code: supplier.code,
    name: supplier.name,
    contact: supplier.contact,
    phone: supplier.phone,
    address: supplier.address,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
};

export default {
  toSupplierDTO,
};
