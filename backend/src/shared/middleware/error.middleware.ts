/**
 * 全局错误处理中间件
 * 用于统一处理应用程序中的错误
 */

import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 确保正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);

    // 捕获堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 常用错误类型
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '未授权，请先登录') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '禁止访问') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '请求参数验证失败') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
  }
}

/**
 * 404 路由未找到处理中间件
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  ResponseUtil.notFound(res, `路由 ${req.method} ${req.originalUrl} 未找到`);
};

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 开发环境下打印错误堆栈
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // 处理自定义应用错误
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode);
    return;
  }

  // 处理 Prisma 错误
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002': // 唯一约束冲突
        const target = prismaError.meta?.target?.join(', ') || '字段';
        ResponseUtil.error(res, `${target} 已存在`, 409);
        return;
      case 'P2025': // 记录未找到
        ResponseUtil.notFound(res, '记录未找到');
        return;
      case 'P2003': // 外键约束失败
        ResponseUtil.error(res, '关联数据不存在', 400);
        return;
      default:
        ResponseUtil.error(res, '数据库操作失败', 500);
        return;
    }
  }

  // 处理 Prisma 验证错误
  if (err.name === 'PrismaClientValidationError') {
    ResponseUtil.error(res, '数据验证失败', 400);
    return;
  }

  // 处理 JSON 解析错误
  if (err instanceof SyntaxError && 'body' in err) {
    ResponseUtil.error(res, '无效的 JSON 格式', 400);
    return;
  }

  // 处理其他未知错误
  const message = process.env.NODE_ENV === 'development' 
    ? err.message 
    : '服务器内部错误';
  
  ResponseUtil.serverError(res, message);
};

export default {
  errorHandler,
  notFoundHandler,
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
};
