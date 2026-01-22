/**
 * 用户模块导出
 */

export * from './user.model';
export * from './user.service';
export * from './user.controller';
export * from './user.routes';

export { UserService } from './user.service';
export { UserController } from './user.controller';
export { createAuthRoutes, createUserRoutes } from './user.routes';
