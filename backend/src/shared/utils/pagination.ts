/**
 * 分页工具类
 * 用于处理分页参数和计算
 */

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页查询参数（用于数据库查询）
 */
export interface PaginationQuery {
  skip: number;
  take: number;
}

/**
 * 分页结果接口
 */
export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 默认分页配置
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

/**
 * 分页工具类
 */
export class PaginationUtil {
  /**
   * 解析分页参数
   * @param page 页码（从1开始）
   * @param pageSize 每页数量
   * @returns 标准化的分页参数
   */
  static parseParams(
    page?: string | number,
    pageSize?: string | number
  ): PaginationParams {
    let parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
    let parsedPageSize = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

    // 验证并设置默认值
    if (!parsedPage || isNaN(parsedPage) || parsedPage < 1) {
      parsedPage = DEFAULT_PAGE;
    }

    if (!parsedPageSize || isNaN(parsedPageSize) || parsedPageSize < 1) {
      parsedPageSize = DEFAULT_PAGE_SIZE;
    }

    // 限制最大每页数量
    if (parsedPageSize > MAX_PAGE_SIZE) {
      parsedPageSize = MAX_PAGE_SIZE;
    }

    return {
      page: parsedPage,
      pageSize: parsedPageSize,
    };
  }

  /**
   * 将分页参数转换为数据库查询参数
   * @param params 分页参数
   * @returns 数据库查询参数（skip, take）
   */
  static toQuery(params: PaginationParams): PaginationQuery {
    const { page, pageSize } = params;
    return {
      skip: (page - 1) * pageSize,
      take: pageSize,
    };
  }

  /**
   * 计算总页数
   * @param total 总记录数
   * @param pageSize 每页数量
   * @returns 总页数
   */
  static calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  }

  /**
   * 创建分页结果
   * @param list 数据列表
   * @param total 总记录数
   * @param params 分页参数
   * @returns 分页结果
   */
  static createResult<T>(
    list: T[],
    total: number,
    params: PaginationParams
  ): PaginationResult<T> {
    const { page, pageSize } = params;
    return {
      list,
      total,
      page,
      pageSize,
      totalPages: this.calculateTotalPages(total, pageSize),
    };
  }

  /**
   * 从请求查询参数中提取分页参数
   * @param query Express 请求的 query 对象
   * @returns 分页参数
   */
  static fromQuery(query: Record<string, unknown>): PaginationParams {
    return this.parseParams(
      query.page as string | number | undefined,
      query.pageSize as string | number | undefined
    );
  }
}

export default PaginationUtil;
