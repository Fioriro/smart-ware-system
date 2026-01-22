/**
 * 库存管理模块导出
 */

// Domain Layer
export { InventoryTransaction } from './domain/entities/InventoryTransaction';
export type {
  TransactionType,
  InboundParams,
  OutboundParams,
  AdjustmentParams,
  TransactionData,
} from './domain/entities/InventoryTransaction';

export type {
  ITransactionRepository,
  TransactionQueryParams,
  TransactionListItem,
} from './domain/repositories/ITransactionRepository';

// Infrastructure Layer
export { TransactionRepository } from './infrastructure/TransactionRepository';

// Application Layer
export { InventoryService } from './application/InventoryService';
export type {
  InboundCommand,
  OutboundCommand,
  BatchInboundCommand,
  TransactionDTO,
  InboundResultDTO,
  BatchInboundResultDTO,
} from './application/InventoryService';

// Interface Layer
export { InventoryController } from './interfaces/InventoryController';
export { createInventoryRoutes } from './interfaces/inventory.routes';
