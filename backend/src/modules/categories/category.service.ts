/**
 * 商品分类服务
 * 处理分类相关的业务逻辑
 */

import { PrismaClient } from '@prisma/client';
import {
  Category,
  CategoryDTO,
  CategoryTreeNodeDTO,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  toCategoryDTO,
  toCategoryTreeNodeDTO,
} from './category.model';

/**
 * 分类服务类
 */
export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取分类树（包含商品数量）
   * @returns 分类树结构
   */
  async getCategoryTree(): Promise<CategoryTreeNodeDTO[]> {
    // 获取所有未删除的分类
    const categories = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        { parentId: 'asc' },
        { id: 'asc' },
      ],
    });

    // 获取每个分类的商品数量
    const productCounts = await this.prisma.product.groupBy({
      by: ['categoryId'],
      where: {
        deletedAt: null,
      },
      _count: {
        id: true,
      },
    });

    // 创建商品数量映射
    const productCountMap = new Map<number, number>();
    productCounts.forEach((item) => {
      productCountMap.set(item.categoryId, item._count.id);
    });

    // 构建分类树
    return this.buildCategoryTree(categories as Category[], productCountMap);
  }

  /**
   * 构建分类树结构
   * @param categories 分类列表
   * @param productCountMap 商品数量映射
   * @returns 分类树
   */
  private buildCategoryTree(
    categories: Category[],
    productCountMap: Map<number, number>
  ): CategoryTreeNodeDTO[] {
    // 创建分类映射
    const categoryMap = new Map<number, CategoryTreeNodeDTO>();
    const rootCategories: CategoryTreeNodeDTO[] = [];

    // 第一遍：创建所有节点
    categories.forEach((category) => {
      const node = toCategoryTreeNodeDTO(
        category,
        productCountMap.get(category.id) || 0,
        []
      );
      categoryMap.set(category.id, node);
    });

    // 第二遍：建立父子关系
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!;
      if (category.parentId === null) {
        rootCategories.push(node);
      } else {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // 如果父分类不存在（可能已被删除），将其作为根分类
          rootCategories.push(node);
        }
      }
    });

    return rootCategories;
  }

  /**
   * 获取分类详情
   * @param id 分类 ID
   * @returns 分类 DTO
   */
  async findById(id: number): Promise<CategoryDTO> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new Error('分类不存在');
    }

    return toCategoryDTO(category as Category);
  }

  /**
   * 创建分类
   * @param createDTO 创建分类信息
   * @returns 分类 DTO
   */
  async create(createDTO: CreateCategoryDTO): Promise<CategoryDTO> {
    const { name, parentId = null } = createDTO;

    // 如果指定了父分类，检查父分类是否存在
    if (parentId !== null) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: parentId,
          deletedAt: null,
        },
      });

      if (!parentCategory) {
        throw new Error('父分类不存在');
      }
    }

    // 检查同级分类名称是否重复
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name,
        parentId,
        deletedAt: null,
      },
    });

    if (existingCategory) {
      throw new Error('同级分类名称已存在');
    }

    // 创建分类
    const category = await this.prisma.category.create({
      data: {
        name,
        parentId,
      },
    });

    return toCategoryDTO(category as Category);
  }

  /**
   * 更新分类
   * @param id 分类 ID
   * @param updateDTO 更新信息
   * @returns 分类 DTO
   */
  async update(id: number, updateDTO: UpdateCategoryDTO): Promise<CategoryDTO> {
    // 检查分类是否存在
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingCategory) {
      throw new Error('分类不存在');
    }

    // 如果要更新父分类
    if (updateDTO.parentId !== undefined) {
      // 不能将分类设为自己的子分类
      if (updateDTO.parentId === id) {
        throw new Error('不能将分类设为自己的子分类');
      }

      // 如果指定了父分类，检查父分类是否存在
      if (updateDTO.parentId !== null) {
        const parentCategory = await this.prisma.category.findFirst({
          where: {
            id: updateDTO.parentId,
            deletedAt: null,
          },
        });

        if (!parentCategory) {
          throw new Error('父分类不存在');
        }

        // 检查是否会形成循环引用（不能将分类设为其子孙分类的子分类）
        const isDescendant = await this.isDescendant(updateDTO.parentId, id);
        if (isDescendant) {
          throw new Error('不能将分类设为其子分类的子分类');
        }
      }
    }

    // 检查同级分类名称是否重复
    const targetParentId = updateDTO.parentId !== undefined 
      ? updateDTO.parentId 
      : existingCategory.parentId;
    const targetName = updateDTO.name !== undefined 
      ? updateDTO.name 
      : existingCategory.name;

    const duplicateCategory = await this.prisma.category.findFirst({
      where: {
        name: targetName,
        parentId: targetParentId,
        deletedAt: null,
        NOT: {
          id,
        },
      },
    });

    if (duplicateCategory) {
      throw new Error('同级分类名称已存在');
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};

    if (updateDTO.name !== undefined) {
      updateData.name = updateDTO.name;
    }

    if (updateDTO.parentId !== undefined) {
      updateData.parentId = updateDTO.parentId;
    }

    // 更新分类
    const category = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });

    return toCategoryDTO(category as Category);
  }

  /**
   * 删除分类（软删除）
   * @param id 分类 ID
   */
  async delete(id: number): Promise<void> {
    // 检查分类是否存在
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existingCategory) {
      throw new Error('分类不存在');
    }

    // 检查是否有子分类
    const childCount = await this.prisma.category.count({
      where: {
        parentId: id,
        deletedAt: null,
      },
    });

    if (childCount > 0) {
      throw new Error('该分类下有子分类，请先删除子分类');
    }

    // 检查是否有关联商品
    const productCount = await this.prisma.product.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });

    if (productCount > 0) {
      throw new Error('该分类下有关联商品，请先移除商品关联');
    }

    // 软删除分类
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 检查 targetId 是否是 ancestorId 的子孙分类
   * @param targetId 目标分类 ID
   * @param ancestorId 祖先分类 ID
   * @returns 是否是子孙分类
   */
  private async isDescendant(targetId: number, ancestorId: number): Promise<boolean> {
    // 获取 ancestorId 的所有子孙分类
    const descendants = await this.getAllDescendants(ancestorId);
    return descendants.includes(targetId);
  }

  /**
   * 获取分类的所有子孙分类 ID
   * @param categoryId 分类 ID
   * @returns 子孙分类 ID 列表
   */
  private async getAllDescendants(categoryId: number): Promise<number[]> {
    const descendants: number[] = [];
    
    // 获取直接子分类
    const children = await this.prisma.category.findMany({
      where: {
        parentId: categoryId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    for (const child of children) {
      descendants.push(child.id);
      // 递归获取子孙分类
      const childDescendants = await this.getAllDescendants(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}

export default CategoryService;
