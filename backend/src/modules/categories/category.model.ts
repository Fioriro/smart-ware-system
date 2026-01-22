/**
 * 商品分类模型
 * 定义分类相关的类型和接口
 */

/**
 * 分类实体接口
 */
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * 分类响应 DTO
 */
export interface CategoryDTO {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 分类树节点 DTO（包含子分类和商品数量）
 */
export interface CategoryTreeNodeDTO {
  id: number;
  name: string;
  parentId: number | null;
  productCount: number;
  children: CategoryTreeNodeDTO[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建分类请求 DTO
 */
export interface CreateCategoryDTO {
  name: string;
  parentId?: number | null;
}

/**
 * 更新分类请求 DTO
 */
export interface UpdateCategoryDTO {
  name?: string;
  parentId?: number | null;
}

/**
 * 分类查询参数
 */
export interface CategoryQueryParams {
  includeProductCount?: boolean;
}

/**
 * 将分类实体转换为 DTO
 * @param category 分类实体
 * @returns 分类 DTO
 */
export const toCategoryDTO = (category: Category): CategoryDTO => {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

/**
 * 将分类实体转换为树节点 DTO
 * @param category 分类实体
 * @param productCount 商品数量
 * @param children 子分类
 * @returns 分类树节点 DTO
 */
export const toCategoryTreeNodeDTO = (
  category: Category,
  productCount: number = 0,
  children: CategoryTreeNodeDTO[] = []
): CategoryTreeNodeDTO => {
  return {
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    productCount,
    children,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
};

export default {
  toCategoryDTO,
  toCategoryTreeNodeDTO,
};
