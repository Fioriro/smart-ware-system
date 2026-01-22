/**
 * 商品模块导出
 */

// Domain Layer
export { Product, StockChangeResult } from './domain/entities/Product';
export {
  IProductRepository,
  ProductQueryParams,
  ProductListItem,
  PrismaTransactionClient,
} from './domain/repositories/IProductRepository';

// Infrastructure Layer
export { ProductRepository } from './infrastructure/ProductRepository';

// Application Layer
export {
  ProductService,
  CreateProductDTO,
  UpdateProductDTO,
  ProductDTO,
} from './application/ProductService';

// Interface Layer
export { ProductController } from './interfaces/ProductController';
export { createProductRoutes } from './interfaces/product.routes';
