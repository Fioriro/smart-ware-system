# SmartStock 智能库存管理助手 - 设计文档

## 1. 系统架构

### 1.1 整体架构

采用前后端分离架构，后端使用混合架构模式：
- **核心业务模块**：DDD + 六边形架构（入库、出库、商品管理）
- **简单模块**：MVC 架构（用户、供应商、分类、日志、仪表盘）

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Pages  │  │Components│  │Services │  │  Hooks  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Express)                       │
│  ┌───────────────────────┐  ┌───────────────────────┐      │
│  │     Core (DDD)        │  │    Modules (MVC)      │      │
│  │  ┌─────────────────┐  │  │  ┌─────────────────┐  │      │
│  │  │ Domain Layer    │  │  │  │  Controllers    │  │      │
│  │  │ Application     │  │  │  │  Services       │  │      │
│  │  │ Infrastructure  │  │  │  │  Models         │  │      │
│  │  │ Interfaces      │  │  │  └─────────────────┘  │      │
│  │  └─────────────────┘  │  └───────────────────────┘      │
│  └───────────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MySQL (smart_ware_system)                 │
└─────────────────────────────────────────────────────────────┘
```


### 1.2 项目目录结构

```
smart-stock/
├── backend/
│   ├── src/
│   │   ├── core/                      # DDD 核心模块
│   │   │   ├── product/               # 商品领域
│   │   │   │   ├── domain/
│   │   │   │   │   ├── entities/
│   │   │   │   │   │   └── Product.ts
│   │   │   │   │   ├── value-objects/
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── IProductRepository.ts
│   │   │   │   ├── application/
│   │   │   │   │   └── ProductService.ts
│   │   │   │   ├── infrastructure/
│   │   │   │   │   └── ProductRepository.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── ProductController.ts
│   │   │   └── inventory/             # 库存领域（入库/出库）
│   │   │       ├── domain/
│   │   │       ├── application/
│   │   │       ├── infrastructure/
│   │   │       └── interfaces/
│   │   ├── modules/                   # MVC 简单模块
│   │   │   ├── users/
│   │   │   │   ├── user.controller.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   └── user.model.ts
│   │   │   ├── suppliers/
│   │   │   ├── categories/
│   │   │   ├── logs/
│   │   │   └── dashboard/
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   │   └── auth.middleware.ts
│   │   │   ├── mappers/               # 数据映射层
│   │   │   │   ├── ProductMapper.ts   # Prisma POJO → Domain Entity
│   │   │   │   └── TransactionMapper.ts
│   │   │   ├── container/             # 依赖注入容器
│   │   │   │   └── index.ts           # 使用 awilix 或手动组装
│   │   │   ├── utils/
│   │   │   └── types/
│   │   ├── config/
│   │   │   └── database.ts
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                       # Next.js App Router
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── products/
│   │   │   │   ├── inbound/
│   │   │   │   ├── outbound/
│   │   │   │   ├── suppliers/
│   │   │   │   ├── categories/
│   │   │   │   ├── logs/
│   │   │   │   └── users/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # 基础 UI 组件
│   │   │   ├── layout/
│   │   │   └── features/              # 业务组件
│   │   ├── services/                  # API 调用
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   ├── .env.development
│   ├── .env.production
│   ├── package.json
│   └── tsconfig.json
├── .kiro/specs/
└── README.md
```

> **架构说明**：
> - `shared/mappers` 目录用于存放 Prisma POJO 到 Domain Entity 的转换器
> - `shared/container` 目录用于依赖注入，可使用 awilix 库或手动组装服务实例


---

## 2. 数据库设计

### 2.1 数据库配置

- **数据库名称**：`smart_ware_system`
- **连接方式**：Prisma ORM
- **软删除**：所有表统一使用 `deleted_at` 字段
- **时间格式**：MySQL DATETIME 类型

### 2.2 数据表设计

#### 2.2.1 用户表 (users)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| password | VARCHAR(255) | NOT NULL | 密码（bcrypt加密） |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'admin' | 角色 |
| status | TINYINT | NOT NULL, DEFAULT 1 | 状态：1启用，0禁用 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted_at | DATETIME | NULL | 软删除时间 |

#### 2.2.2 商品分类表 (categories)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| parent_id | INT | FK, NULL | 父分类ID |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted_at | DATETIME | NULL | 软删除时间 |


#### 2.2.3 商品表 (products)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| sku | VARCHAR(50) | UNIQUE, NOT NULL | SKU编码 |
| name | VARCHAR(200) | NOT NULL | 商品名称 |
| category_id | INT | FK, NOT NULL | 分类ID |
| unit | VARCHAR(20) | NOT NULL | 单位 |
| quantity | INT | NOT NULL, DEFAULT 0 | 库存数量 |
| min_threshold | INT | NOT NULL, DEFAULT 10 | 预警阈值 |
| cost_price | DECIMAL(10,2) | NULL | 成本价 |
| sale_price | DECIMAL(10,2) | NULL | 售价 |
| version | INT | NOT NULL, DEFAULT 1 | 乐观锁版本号 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted_at | DATETIME | NULL | 软删除时间 |

> **乐观锁说明**：`version` 字段用于防止并发库存操作导致的数据不一致。每次更新库存时，需要检查版本号并递增：
> ```sql
> UPDATE products SET quantity = ?, version = version + 1 
> WHERE id = ? AND version = ?
> ```
> 如果更新影响行数为 0，说明数据已被其他请求修改，需要重试或返回错误。

#### 2.2.4 供应商表 (suppliers)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| code | VARCHAR(50) | UNIQUE, NOT NULL | 供应商编码 |
| name | VARCHAR(200) | NOT NULL | 供应商名称 |
| contact | VARCHAR(100) | NULL | 联系人 |
| phone | VARCHAR(20) | NULL | 联系电话 |
| address | VARCHAR(500) | NULL | 地址 |
| created_at | DATETIME | NOT NULL | 创建时间 |
| updated_at | DATETIME | NOT NULL | 更新时间 |
| deleted_at | DATETIME | NULL | 软删除时间 |


#### 2.2.5 库存交易表 (inventory_transactions)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | INT | PK, AUTO_INCREMENT | 主键 |
| type | ENUM('IN','OUT','ADJUSTMENT') | NOT NULL | 交易类型 |
| product_id | INT | FK, NOT NULL | 商品ID |
| sku | VARCHAR(50) | NOT NULL | 商品SKU（冗余） |
| quantity | INT | NOT NULL | 数量（正数） |
| quantity_before | INT | NOT NULL | 变化前库存 |
| quantity_after | INT | NOT NULL | 变化后库存 |
| supplier_id | INT | FK, NULL | 供应商ID（入库时） |
| operator_id | INT | FK, NOT NULL | 操作人ID |
| remark | VARCHAR(500) | NULL | 备注 |
| created_at | DATETIME | NOT NULL | 操作时间 |

> **交易类型说明**：
> - `IN`：入库
> - `OUT`：出库
> - `ADJUSTMENT`：盘点调整（当实际库存与系统库存不符时使用）
>
> 注：库存交易表作为审计日志，不支持软删除。

### 2.3 ER 关系图

```
users 1──────────────────────────────────────┐
                                              │
categories 1───┬──< categories (self-ref)     │
               │                              │
               └──< products >──1 categories  │
                        │                     │
suppliers 1─────────────┼─────────────────────┤
                        │                     │
                        ▼                     │
              inventory_transactions >────────┘
                (type: IN/OUT/ADJUSTMENT)
```


---

## 3. API 接口设计

### 3.1 API 规范

- **基础路径**：`/api/v1`
- **认证方式**：JWT Bearer Token
- **分页参数**：`page`（页码，从1开始）、`pageSize`（每页数量，默认10）

### 3.2 统一响应格式

```typescript
// 成功响应
{
  "code": 200,
  "message": "success",
  "data": { ... }
}

// 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}

// 错误响应
{
  "code": 400,  // HTTP 状态码
  "message": "错误描述",
  "data": null
}
```

### 3.3 认证接口 (Auth)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/v1/auth/login | 用户登录 | 否 |
| POST | /api/v1/auth/logout | 用户登出 | 是 |
| POST | /api/v1/auth/reset-password | 重置密码 | 否 |
| GET | /api/v1/auth/me | 获取当前用户信息 | 是 |

### 3.4 用户管理接口 (Users)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/users | 获取用户列表（分页） |
| GET | /api/v1/users/:id | 获取用户详情 |
| POST | /api/v1/users | 创建用户 |
| PUT | /api/v1/users/:id | 更新用户 |
| DELETE | /api/v1/users/:id | 删除用户（软删除） |

### 3.5 商品分类接口 (Categories)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/categories | 获取分类列表（树形） |
| GET | /api/v1/categories/:id | 获取分类详情 |
| POST | /api/v1/categories | 创建分类 |
| PUT | /api/v1/categories/:id | 更新分类 |
| DELETE | /api/v1/categories/:id | 删除分类（软删除） |


### 3.6 商品管理接口 (Products)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/products | 获取商品列表（分页） |
| GET | /api/v1/products/:id | 获取商品详情 |
| GET | /api/v1/products/sku/:sku | 根据SKU查询商品 |
| GET | /api/v1/products/low-stock | 获取低库存商品列表 |
| POST | /api/v1/products | 创建商品 |
| PUT | /api/v1/products/:id | 更新商品 |
| DELETE | /api/v1/products/:id | 删除商品（软删除） |

### 3.7 供应商管理接口 (Suppliers)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/suppliers | 获取供应商列表（分页） |
| GET | /api/v1/suppliers/:id | 获取供应商详情 |
| POST | /api/v1/suppliers | 创建供应商 |
| PUT | /api/v1/suppliers/:id | 更新供应商 |
| DELETE | /api/v1/suppliers/:id | 删除供应商（软删除） |

### 3.8 入库管理接口 (Inbound)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/inventory/inbound | 单个商品入库 |
| POST | /api/v1/inventory/inbound/batch | 批量入库 |
| GET | /api/v1/inventory/inbound/records | 获取入库记录（分页） |

### 3.9 出库管理接口 (Outbound)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/inventory/outbound | 商品出库 |
| GET | /api/v1/inventory/outbound/records | 获取出库记录（分页） |

### 3.10 审计日志接口 (Logs)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/logs | 获取审计日志列表（分页） |
| GET | /api/v1/logs/export | 导出审计日志（Excel） |

### 3.11 仪表盘接口 (Dashboard)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v1/dashboard/stats | 获取仪表盘统计数据 |


---

## 4. 领域模型设计（DDD 核心模块）

### 4.1 商品领域 (Product Domain)

#### 4.1.1 Product 实体（充血模型）

```typescript
class Product {
  private id: number;
  private sku: string;
  private name: string;
  private categoryId: number;
  private unit: string;
  private quantity: number;
  private minThreshold: number;
  private costPrice: number | null;
  private salePrice: number | null;
  private version: number;  // 乐观锁版本号

  // 静态工厂方法：从 Prisma POJO 重建领域实体
  static reconstruct(data: ProductData): Product {
    const product = new Product();
    product.id = data.id;
    product.sku = data.sku;
    product.name = data.name;
    product.categoryId = data.category_id;
    product.unit = data.unit;
    product.quantity = data.quantity;
    product.minThreshold = data.min_threshold;
    product.costPrice = data.cost_price;
    product.salePrice = data.sale_price;
    product.version = data.version;
    return product;
  }

  // Getter 方法
  getId(): number { return this.id; }
  getSku(): string { return this.sku; }
  getQuantity(): number { return this.quantity; }
  getVersion(): number { return this.version; }

  // 业务方法
  adjustStock(change: number): void {
    const newQuantity = this.quantity + change;
    if (newQuantity < 0) {
      throw new Error('库存不足');
    }
    this.quantity = newQuantity;
  }

  isLowStock(): boolean {
    return this.quantity <= this.minThreshold;
  }

  canOutbound(quantity: number): boolean {
    return this.quantity >= quantity;
  }

  inbound(quantity: number): { before: number; after: number } {
    const before = this.quantity;
    this.adjustStock(quantity);
    return { before, after: this.quantity };
  }

  outbound(quantity: number): { before: number; after: number } {
    if (!this.canOutbound(quantity)) {
      throw new Error('库存不足，无法出库');
    }
    const before = this.quantity;
    this.adjustStock(-quantity);
    return { before, after: this.quantity };
  }
}
```


#### 4.1.2 仓储接口

```typescript
interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(params: ProductQueryParams): Promise<PaginatedResult<Product>>;
  findLowStock(): Promise<Product[]>;
  save(product: Product, tx?: PrismaTransactionClient): Promise<Product>;
  delete(id: number): Promise<void>;
}
```

### 4.2 库存领域 (Inventory Domain)

#### 4.2.1 InventoryTransaction 实体

```typescript
class InventoryTransaction {
  private id: number;
  private type: 'IN' | 'OUT' | 'ADJUSTMENT';
  private productId: number;
  private sku: string;
  private quantity: number;
  private quantityBefore: number;
  private quantityAfter: number;
  private supplierId: number | null;
  private operatorId: number;
  private remark: string | null;
  private createdAt: Date;

  static createInbound(params: InboundParams): InventoryTransaction {
    return new InventoryTransaction({ type: 'IN', ...params });
  }

  static createOutbound(params: OutboundParams): InventoryTransaction {
    return new InventoryTransaction({ type: 'OUT', supplierId: null, ...params });
  }

  static createAdjustment(params: AdjustmentParams): InventoryTransaction {
    return new InventoryTransaction({ type: 'ADJUSTMENT', supplierId: null, ...params });
  }
}
```


#### 4.2.2 库存应用服务（含事务控制）

```typescript
import { PrismaClient } from '@prisma/client';

class InventoryService {
  constructor(
    private prisma: PrismaClient,
    private productRepository: IProductRepository,
    private transactionRepository: ITransactionRepository
  ) {}

  async inbound(params: InboundCommand): Promise<void> {
    // 使用 Prisma 事务确保数据一致性
    await this.prisma.$transaction(async (tx) => {
      const product = await this.productRepository.findBySku(params.sku);
      if (!product) throw new Error('商品不存在');

      const { before, after } = product.inbound(params.quantity);
      
      const transaction = InventoryTransaction.createInbound({
        productId: product.getId(),
        sku: params.sku,
        quantity: params.quantity,
        quantityBefore: before,
        quantityAfter: after,
        supplierId: params.supplierId,
        operatorId: params.operatorId,
        remark: params.remark
      });

      // 使用乐观锁更新库存
      const updated = await tx.product.updateMany({
        where: { 
          id: product.getId(), 
          version: product.getVersion() 
        },
        data: { 
          quantity: after, 
          version: { increment: 1 } 
        }
      });

      if (updated.count === 0) {
        throw new Error('并发冲突，请重试');
      }

      await this.transactionRepository.save(transaction, tx);
    });
  }

  async outbound(params: OutboundCommand): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await this.productRepository.findBySku(params.sku);
      if (!product) throw new Error('商品不存在');

      const { before, after } = product.outbound(params.quantity);
      
      const transaction = InventoryTransaction.createOutbound({
        productId: product.getId(),
        sku: params.sku,
        quantity: params.quantity,
        quantityBefore: before,
        quantityAfter: after,
        operatorId: params.operatorId,
        remark: params.remark
      });

      const updated = await tx.product.updateMany({
        where: { 
          id: product.getId(), 
          version: product.getVersion() 
        },
        data: { 
          quantity: after, 
          version: { increment: 1 } 
        }
      });

      if (updated.count === 0) {
        throw new Error('并发冲突，请重试');
      }

      await this.transactionRepository.save(transaction, tx);
    });
  }
}
```

> **事务控制说明**：使用 `prisma.$transaction()` 确保库存更新和流水记录的原子性。如果任一操作失败，整个事务回滚。


### 4.3 依赖注入配置

```typescript
// shared/container/index.ts
import { PrismaClient } from '@prisma/client';
import { ProductRepository } from '../../core/product/infrastructure/ProductRepository';
import { TransactionRepository } from '../../core/inventory/infrastructure/TransactionRepository';
import { InventoryService } from '../../core/inventory/application/InventoryService';
import { ProductService } from '../../core/product/application/ProductService';

// 简单的依赖注入容器（手动组装）
export function createContainer() {
  const prisma = new PrismaClient();
  
  // 仓储层
  const productRepository = new ProductRepository(prisma);
  const transactionRepository = new TransactionRepository(prisma);
  
  // 应用服务层
  const inventoryService = new InventoryService(
    prisma,
    productRepository,
    transactionRepository
  );
  const productService = new ProductService(productRepository);
  
  return {
    prisma,
    productRepository,
    transactionRepository,
    inventoryService,
    productService
  };
}

// 在 app.ts 中使用
const container = createContainer();
```

> **依赖注入说明**：Node.js/Express 没有 Spring 那样的自动依赖注入。这里采用手动组装方式，也可以使用 `awilix` 等轻量级 DI 库。


---

## 5. 前端架构设计

### 5.1 技术选型

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 14 (App Router) | React 全栈框架 |
| 样式 | Tailwind CSS | 原子化 CSS |
| 状态管理 | Zustand | 轻量级状态管理 |
| 数据获取 | SWR | 客户端数据缓存 |
| 表单处理 | React Hook Form + Zod | 表单验证 |
| HTTP 客户端 | Axios | API 请求 |

### 5.2 页面路由

```
/login                 # 登录页
/dashboard             # 仪表盘
/products              # 商品列表
/products/new          # 新建商品
/products/:id/edit     # 编辑商品
/categories            # 商品分类
/inbound               # 入库管理
/outbound              # 出库管理
/suppliers             # 供应商列表
/logs                  # 审计日志
/users                 # 用户管理
```

### 5.3 设计规范常量

```typescript
// styles/design-tokens.ts
export const colors = {
  background: '#F8FAFC',        // Slate-50
  cardBg: 'rgba(255,255,255,0.7)',
  cardBorder: '#F1F5F9',        // Slate-100
  heading: '#334155',           // Slate-700
  body: '#64748B',              // Slate-500
  primary: '#0F172A',           // Slate-900
  danger: { bg: '#FFF1F2', text: '#E11D48', border: '#F43F5E' },
  success: { bg: '#ECFDF5', text: '#059669' }
};

export const shadows = {
  card: '0 4px 20px -5px rgba(148, 163, 184, 0.15)',
  button: '0 10px 15px -3px rgba(15, 23, 42, 0.2)'
};
```


---

## 6. 安全设计

### 6.1 认证流程

```
1. 用户提交用户名密码
2. 后端验证凭据，生成 JWT Token（有效期24小时）
3. 前端存储 Token 到 localStorage
4. 后续请求在 Header 中携带 Token：Authorization: Bearer <token>
5. 后端中间件验证 Token 有效性
6. Token 过期返回 401，前端跳转登录页
```

### 6.2 JWT Token 结构

```typescript
interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  iat: number;  // 签发时间
  exp: number;  // 过期时间
}
```

### 6.3 路由守卫

使用 Next.js Middleware 实现服务端路由守卫：

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
}
```

---

## 7. 开发规范

### 7.1 代码规范

- **TypeScript**：严格模式，禁止 `any`
- **ESLint**：Next.js 默认配置 + TypeScript 推荐规则
- **Prettier**：统一代码格式化

### 7.2 Git 提交规范

使用 Conventional Commits：`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

### 7.3 测试策略

- **单元测试**：Vitest
- **测试覆盖**：核心业务逻辑必须有单元测试
- **测试文件**：与源文件同目录，命名 `*.test.ts`

---

## 8. 环境配置

### 8.1 后端环境变量 (.env.development)

```env
DB_HOST=xxx.xxx.xxx.xxx
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=smart_ware_system
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
```

### 8.2 前端环境变量 (.env.development)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 9. 版本信息

- 文档版本：1.1
- 创建日期：2026-01-21
- 更新日期：2026-01-21
- 状态：待审批