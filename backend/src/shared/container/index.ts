/**
 * 依赖注入容器
 * 用于管理和组装应用程序的依赖关系
 */

import { PrismaClient } from '@prisma/client';

/**
 * 容器接口
 * 定义容器中可用的服务和仓储
 */
export interface Container {
  prisma: PrismaClient;
  // 后续会添加更多服务和仓储
  // productRepository: IProductRepository;
  // transactionRepository: ITransactionRepository;
  // inventoryService: InventoryService;
  // productService: ProductService;
}

/**
 * 单例 Prisma 客户端实例
 */
let prismaInstance: PrismaClient | null = null;

/**
 * 获取 Prisma 客户端实例（单例模式）
 */
export const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
    });
  }
  return prismaInstance;
};

/**
 * 容器实例
 */
let containerInstance: Container | null = null;

/**
 * 创建依赖注入容器
 * 手动组装所有服务和仓储的依赖关系
 */
export const createContainer = (): Container => {
  if (containerInstance) {
    return containerInstance;
  }

  const prisma = getPrismaClient();

  // 创建容器实例
  // 后续会在这里组装更多的服务和仓储
  containerInstance = {
    prisma,
    // 示例：后续添加仓储和服务
    // productRepository: new ProductRepository(prisma),
    // transactionRepository: new TransactionRepository(prisma),
    // inventoryService: new InventoryService(prisma, productRepository, transactionRepository),
    // productService: new ProductService(productRepository),
  };

  return containerInstance;
};

/**
 * 获取容器实例
 */
export const getContainer = (): Container => {
  if (!containerInstance) {
    return createContainer();
  }
  return containerInstance;
};

/**
 * 关闭容器（清理资源）
 * 主要用于应用程序关闭时断开数据库连接
 */
export const closeContainer = async (): Promise<void> => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
  containerInstance = null;
};

/**
 * 重置容器（用于测试）
 */
export const resetContainer = async (): Promise<void> => {
  await closeContainer();
};

export default {
  createContainer,
  getContainer,
  closeContainer,
  resetContainer,
  getPrismaClient,
};
