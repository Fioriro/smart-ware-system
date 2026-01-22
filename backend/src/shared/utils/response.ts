/**
 * 统一响应工具类
 * 用于生成标准化的 API 响应格式
 */

import { Response } from 'express';

/**
 * 统一响应数据结构
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/**
 * 分页数据结构
 */
export interface PaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 分页响应数据结构
 */
export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

/**
 * 响应工具类
 */
export class ResponseUtil {
  /**
   * 成功响应
   * @param res Express Response 对象
   * @param data 响应数据
   * @param message 响应消息
   * @param code HTTP 状态码
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'success',
    code: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      code,
      message,
      data,
    };
    return res.status(code).json(response);
  }

  /**
   * 分页响应
   * @param res Express Response 对象
   * @param list 数据列表
   * @param total 总数
   * @param page 当前页码
   * @param pageSize 每页数量
   * @param message 响应消息
   */
  static paginated<T>(
    res: Response,
    list: T[],
    total: number,
    page: number,
    pageSize: number,
    message: string = 'success'
  ): Response {
    const response: PaginatedResponse<T> = {
      code: 200,
      message,
      data: {
        list,
        total,
        page,
        pageSize,
      },
    };
    return res.status(200).json(response);
  }

  /**
   * 错误响应
   * @param res Express Response 对象
   * @param message 错误消息
   * @param code HTTP 状态码
   */
  static error(
    res: Response,
    message: string,
    code: number = 400
  ): Response {
    const response: ApiResponse<null> = {
      code,
      message,
      data: null,
    };
    return res.status(code).json(response);
  }

  /**
   * 未授权响应 (401)
   * @param res Express Response 对象
   * @param message 错误消息
   */
  static unauthorized(
    res: Response,
    message: string = '未授权，请先登录'
  ): Response {
    return this.error(res, message, 401);
  }

  /**
   * 禁止访问响应 (403)
   * @param res Express Response 对象
   * @param message 错误消息
   */
  static forbidden(
    res: Response,
    message: string = '禁止访问'
  ): Response {
    return this.error(res, message, 403);
  }

  /**
   * 资源未找到响应 (404)
   * @param res Express Response 对象
   * @param message 错误消息
   */
  static notFound(
    res: Response,
    message: string = '资源未找到'
  ): Response {
    return this.error(res, message, 404);
  }

  /**
   * 服务器内部错误响应 (500)
   * @param res Express Response 对象
   * @param message 错误消息
   */
  static serverError(
    res: Response,
    message: string = '服务器内部错误'
  ): Response {
    return this.error(res, message, 500);
  }

  /**
   * 创建成功响应 (201)
   * @param res Express Response 对象
   * @param data 响应数据
   * @param message 响应消息
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = '创建成功'
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * 无内容响应 (204)
   * @param res Express Response 对象
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}

export default ResponseUtil;
