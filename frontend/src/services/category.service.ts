/**
 * 分类 API 服务
 */
import { apiService, ApiResponse } from './api';

// 分类类型定义
export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  productCount?: number;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

// 分类树节点
export interface CategoryTreeNode {
  id: number;
  name: string;
  parentId: number | null;
  productCount?: number;
  children: CategoryTreeNode[];
}

// 分类服务
export const categoryService = {
  /**
   * 获取分类树
   */
  async getCategories(): Promise<ApiResponse<CategoryTreeNode[]>> {
    return apiService.get<CategoryTreeNode[]>('/categories');
  },

  /**
   * 获取分类详情
   */
  async getCategory(id: number): Promise<ApiResponse<Category>> {
    return apiService.get<Category>(`/categories/${id}`);
  },

  /**
   * 创建分类
   */
  async createCategory(data: { name: string; parentId?: number }): Promise<ApiResponse<Category>> {
    return apiService.post<Category>('/categories', data);
  },

  /**
   * 更新分类
   */
  async updateCategory(id: number, data: { name?: string; parentId?: number }): Promise<ApiResponse<Category>> {
    return apiService.put<Category>(`/categories/${id}`, data);
  },

  /**
   * 删除分类
   */
  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/categories/${id}`);
  },
};

/**
 * 将分类树扁平化为列表（用于下拉选择）
 */
export function flattenCategories(
  categories: CategoryTreeNode[],
  level: number = 0
): Array<{ id: number; name: string; level: number }> {
  const result: Array<{ id: number; name: string; level: number }> = [];
  
  for (const category of categories) {
    result.push({
      id: category.id,
      name: category.name,
      level,
    });
    
    if (category.children && category.children.length > 0) {
      result.push(...flattenCategories(category.children, level + 1));
    }
  }
  
  return result;
}

export default categoryService;
