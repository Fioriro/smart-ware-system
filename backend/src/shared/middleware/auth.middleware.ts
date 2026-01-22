/**
 * JWT 认证中间件
 * 用于验证 API 请求的 JWT Token
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseUtil } from '../utils/response';

/**
 * JWT Payload 结构
 */
export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * 扩展 Express Request 类型，添加用户信息
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * 获取 JWT 密钥
 */
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未配置');
  }
  return secret;
};

/**
 * 从请求头中提取 Token
 * @param req Express Request 对象
 * @returns Token 字符串或 null
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // 支持 "Bearer <token>" 格式
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
};

/**
 * JWT 认证中间件
 * 验证请求中的 JWT Token，并将解码后的用户信息附加到 req.user
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);

    if (!token) {
      ResponseUtil.unauthorized(res, '未提供认证令牌');
      return;
    }

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // 将用户信息附加到请求对象
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ResponseUtil.unauthorized(res, '认证令牌已过期，请重新登录');
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      ResponseUtil.unauthorized(res, '无效的认证令牌');
      return;
    }

    ResponseUtil.serverError(res, '认证过程中发生错误');
  }
};

/**
 * 可选认证中间件
 * 如果提供了 Token 则验证，否则继续执行
 */
export const optionalAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractToken(req);

    if (token) {
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret) as JWTPayload;
      req.user = decoded;
    }

    next();
  } catch {
    // Token 无效时，不设置 user，继续执行
    next();
  }
};

/**
 * 角色验证中间件工厂
 * @param allowedRoles 允许的角色列表
 * @returns 中间件函数
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return ResponseUtil.unauthorized(res, '请先登录');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ResponseUtil.forbidden(res, '权限不足');
    }

    next();
  };
};

/**
 * 生成 JWT Token
 * @param payload Token 载荷
 * @returns JWT Token 字符串
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * 验证 JWT Token
 * @param token JWT Token 字符串
 * @returns 解码后的 Payload 或 null
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
};

export default authMiddleware;
