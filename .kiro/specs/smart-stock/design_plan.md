# SmartStock 设计计划

## 计划步骤

- [x] 1. 设计问题澄清与确认 ✅
- [x] 2. 系统架构设计 ✅
- [x] 3. 数据库详细设计 ✅
- [x] 4. API 接口设计 ✅
- [x] 5. 前端组件架构设计 ✅
- [x] 6. 状态管理设计 ✅
- [x] 7. 安全机制设计 ✅
- [ ] 8. 设计文档整合与审批

---

## 第一阶段：系统架构问题

### 项目结构

#### Q1: 前后端项目结构
[Question] 前端（Next.js）和后端（Express）是放在同一个仓库（Monorepo）还是分开两个独立仓库？
[Answer] 放在同一个仓库，并且是在同一个项目文件夹下，使用 backend 和 frontend 文件夹来区分前后端代码

#### Q2: 目录命名规范
[Question] 项目目录结构偏好哪种风格？
- 选项A：按功能模块划分（如 `/modules/products`, `/modules/suppliers`）
- 选项B：按技术层划分（如 `/controllers`, `/services`, `/models`）
[Answer] 选项B，按技术层划分，但是对于入库、出库这些核心业务，应该采用DDD架构，并且使用六边形架构。商品这样的核心概念要使用充血模型。而对于其他模块，比如审计日志展示等，使用基础的mvc架构就行。同时核心模块使用ddd架构的，要在同一个文件夹下。而使用mvc的统一放到另一个文件夹下。然后前端这块采用简洁的最佳实践就行，比如api调用抽离出来放到service，然后静态资源、页面这些也是分别放置。

---

## 第二阶段：数据库设计问题

### 数据库连接与配置

#### Q3: 数据库连接方式
[Question] 后端连接 MySQL 使用哪种方式？
- 选项A：原生 mysql2 驱动（轻量，直接写SQL）
- 选项B：Prisma ORM（类型安全，自动迁移）
- 选项C：TypeORM（装饰器风格，功能丰富）
[Answer] node.js连接mysql数据库的方式我不太了解，但是数据库是远程服务器的数据库，通过ip+端口访问，同时使用用户名+密码登录。只要能满足这种连接方式的情况下，能正常进行数据库连接，那么使用哪种选项都是可以的。

#### Q4: 数据库名称
[Question] MySQL 数据库名称使用什么？建议：`smartstock` 或 `smart_stock`
[Answer] 数据库已经建好了，名称是 smart_ware_system.

### 数据表设计

#### Q5: 软删除机制
[Question] 删除数据时是否使用软删除（添加 `deleted_at` 字段标记删除，而非真正删除）？这样可以保留历史数据用于审计。
[Answer] 统一使用软删除

#### Q6: 时间字段格式
[Question] 时间字段存储格式偏好：
- 选项A：MySQL DATETIME 类型
- 选项B：UNIX 时间戳（INT）
[Answer] 使用 datetime 类型

#### Q7: 入库/出库记录表
[Question] 入库和出库记录是存在同一张表（通过 `type` 字段区分），还是分开两张表？
- 选项A：合并为 `inventory_transactions` 表
- 选项B：分开为 `inbound_records` 和 `outbound_records` 表
[Answer] 合并存放，这样方便按照商品查找数据

---

## 第三阶段：API 设计问题

### API 规范

#### Q8: API 路径前缀
[Question] API 路径是否需要版本前缀？例如 `/api/v1/products` 还是直接 `/api/products`？
[Answer] 需要版本前缀

#### Q9: 分页参数规范
[Question] 分页 API 的参数命名偏好：
- 选项A：`page` + `pageSize`（页码 + 每页数量）
- 选项B：`offset` + `limit`（偏移量 + 限制数量）
[Answer] 使用 page + pageSize 的方式，偏移量要么靠后端计算，要么靠框架计算

#### Q10: 响应格式
[Question] API 响应是否统一包装？建议格式：
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```
还是直接返回数据，通过 HTTP 状态码表示结果？
[Answer] API相应要统一包装，就返回 code, message, data。

### 错误处理

#### Q11: 错误码设计
[Question] 是否需要定义业务错误码体系？例如：
- 10001: 用户名已存在
- 10002: SKU已存在
- 20001: 库存不足
还是直接使用 HTTP 状态码 + 错误消息？
[Answer] 错误吗先按 http 状态码 + 错误消息，先保证简洁以及功能可用，后续再迭代完善

---

## 第四阶段：前端架构问题

### 状态管理

#### Q12: 全局状态管理
[Question] 前端全局状态管理使用哪种方案？
- 选项A：React Context（轻量，内置）
- 选项B：Zustand（简洁，流行）
- 选项C：Redux Toolkit（功能全面，学习曲线较高）
[Answer] 使用 node.js 写前端我不太了解，使用一个简洁好维护的框架即可。

#### Q13: 服务端/客户端数据获取
[Question] 数据获取策略偏好：
- 选项A：主要使用 Next.js Server Components + Server Actions
- 选项B：主要使用客户端 fetch + React Query/SWR 缓存
- 选项C：混合使用（首屏 SSR，交互用客户端）
[Answer] 我之前是写 java 的，可以用类似于 java 后端取数据的方式，比如调用后端接口，然后后端通过mybatis查询数据库，然后返回数据。

### 组件设计

#### Q14: UI 组件库
[Question] 是否使用现成的 UI 组件库？
- 选项A：纯 Tailwind CSS 手写组件（完全自定义）
- 选项B：Shadcn/ui（基于 Radix，可定制性强）
- 选项C：Ant Design（功能丰富，企业级）
[Answer] UI 库你来判断是否有组件风格满足原型设计里面的风格，如果没有就手写组件；如果有就复用。

#### Q15: 表单处理
[Question] 表单验证和处理使用哪种方案？
- 选项A：React Hook Form + Zod
- 选项B：Formik + Yup
- 选项C：原生 HTML5 验证 + 手写逻辑
[Answer] 前端表单处理这块我不太了解，使用主流方式即可

---

## 第五阶段：认证与安全问题

### JWT 配置

#### Q16: Token 存储位置
[Question] JWT Token 在前端存储在哪里？
- 选项A：localStorage（简单，但有 XSS 风险）
- 选项B：httpOnly Cookie（更安全，需后端配合）
- 选项C：内存 + Refresh Token 机制
[Answer] 存放在后端，后端可以建表，以及使用 redis 进行JWT维护

#### Q17: Token 刷新机制
[Question] JWT 过期后的处理方式：
- 选项A：直接跳转登录页重新登录
- 选项B：使用 Refresh Token 自动续期
[Answer] 过期后跳转登录页重新登录

### 权限控制

#### Q18: 前端路由守卫
[Question] 未登录用户访问受保护页面时的处理：
- 选项A：前端路由守卫拦截，跳转登录页
- 选项B：服务端中间件拦截（Next.js Middleware）
- 选项C：两者结合
[Answer] 这一块我也不太了解，使用主流、好维护的方式即可

---

## 第六阶段：开发规范问题

### 代码规范

#### Q19: 代码风格
[Question] 是否需要配置 ESLint + Prettier？如果是，使用哪种预设？
- 选项A：Next.js 默认配置
- 选项B：Airbnb 规范
- 选项C：自定义规则
[Answer] 前端配置简洁的 eslint 即可，按照typescript的推荐实践写风格。具体的我也不是很了解，使用主流风格即可。

#### Q20: Git 提交规范
[Question] 是否需要使用 Conventional Commits 规范（如 `feat:`, `fix:`, `docs:`）？
[Answer]需要使用这个规范，比如 feat:初始化项目； bugfix: 修复某些bug

### 测试策略

#### Q21: 测试框架
[Question] 是否需要编写自动化测试？如果是，使用哪种框架？
- 选项A：Jest + React Testing Library（单元测试）
- 选项B：Vitest（更快，Vite 生态）
- 选项C：Playwright/Cypress（E2E 测试）
- 选项D：暂不需要测试
[Answer] node.js 全栈的测试框架我不太了解，使用主流并且好维护的框架即可。不过每次完成一个接口相关的功能，都要进行单元测试。

---

## 第七阶段：部署与环境问题

#### Q22: 环境变量管理
[Question] 环境变量如何管理？
- 选项A：`.env` 文件（开发）+ 环境变量（生产）
- 选项B：统一使用 `.env.local`, `.env.development`, `.env.production`
[Answer] 使用 -dev, -prod 这样的形式的文件

#### Q23: 端口配置
[Question] 本地开发时，前端和后端分别使用哪个端口？建议：
- 前端：3000
- 后端：3001
[Answer] 不产生端口冲突的方式就行

---

## 第八阶段：追加澄清问题

基于您的回答，我需要进一步澄清以下细节：

### 架构相关

#### Q24: DDD 核心模块范围 (Updated)
[Question] 您提到入库、出库使用 DDD + 六边形架构，商品使用充血模型。请确认以下模块的归类：
- **DDD 核心模块**：入库管理、出库管理、商品管理（含库存预警）
- **MVC 简单模块**：用户管理、供应商管理、商品分类、审计日志、仪表盘
这个划分是否正确？
[Answer]正确的，就按照这个方式划分

#### Q25: 充血模型边界
[Question] 商品（Product）充血模型需要包含哪些业务行为？建议：
- `adjustStock(quantity)` - 调整库存
- `checkLowStock()` - 检查是否低库存
- `canOutbound(quantity)` - 检查是否可出库
是否还需要其他业务方法？
[Answer] 涉及商品的方法都需要包含在充血模型内，具体的你可以根据接口需求去设计

### 数据库连接相关

#### Q26: 数据库连接信息
[Question] 您提到数据库是远程服务器，通过 IP + 端口 + 用户名密码访问。这些敏感信息将存放在 `.env` 文件中，格式如下：
```
DB_HOST=xxx.xxx.xxx.xxx
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=smart_ware_system
```
这个配置方式是否可以接受？
[Answer]可以的，spring 就是这样配置的

### Token 存储相关

#### Q27: Token 存储方案 (Updated)
[Question] 您提到 JWT Token 存放在后端，使用 Redis 维护。但 MVP 阶段是否需要引入 Redis？有两个方案：
- **方案A**：使用 Redis 存储 Token（需要额外部署 Redis）
- **方案B**：JWT 无状态验证 + 数据库存储用户会话（不需要 Redis，更简单）
- **方案C**：纯 JWT 无状态验证（最简单，Token 存前端 localStorage）
MVP 阶段建议使用方案C，后续再升级。您的选择是？
[Answer] 可以使用方案C，等后续可以再升级后端+redis的方式，提前预留好升级空间就行

### 前端技术选型确认

#### Q28: 前端数据获取方式确认
[Question] 基于您的 Java 后端经验，我理解您希望的模式是：
```
前端页面 → 调用后端 API → 后端查询数据库 → 返回 JSON 数据
```
在 Next.js 中，这对应"客户端数据获取"模式（使用 fetch 调用 API）。我将采用这种方式，配合 SWR 库进行数据缓存和状态管理。这样可以吗？
[Answer] 可以的

---

## 设计决策摘要（待确认）

基于您的回答，以下是我理解的设计决策，请确认：

### 项目结构
```
smart-stock/
├── backend/                    # Express 后端
│   ├── src/
│   │   ├── core/              # DDD 核心模块（入库、出库、商品）
│   │   │   ├── domain/        # 领域模型
│   │   │   ├── application/   # 应用服务
│   │   │   ├── infrastructure/# 基础设施（仓储实现）
│   │   │   └── interfaces/    # 接口层（Controller）
│   │   ├── modules/           # MVC 简单模块
│   │   │   ├── users/
│   │   │   ├── suppliers/
│   │   │   ├── categories/
│   │   │   ├── logs/
│   │   │   └── dashboard/
│   │   └── shared/            # 共享代码
│   └── .env.development
├── frontend/                   # Next.js 前端
│   ├── src/
│   │   ├── app/               # 页面路由
│   │   ├── components/        # UI 组件
│   │   ├── services/          # API 调用
│   │   └── lib/               # 工具函数
│   └── .env.development
└── .kiro/specs/               # 规范文档
```

### 技术选型
| 类别 | 选择 | 说明 |
|------|------|------|
| 数据库连接 | Prisma ORM | 类型安全，自动迁移 |
| 状态管理 | Zustand | 轻量简洁 |
| 数据获取 | SWR | 客户端缓存 |
| UI 组件 | Tailwind + 手写 | 匹配原型风格 |
| 表单处理 | React Hook Form + Zod | 主流方案 |
| 测试框架 | Vitest | 快速，现代 |
| 路由守卫 | Next.js Middleware | 服务端拦截 |

---

## 待回答

请回答追加的问题（Q24-Q28），并确认设计决策摘要是否正确。

完成后请回复"已完成"或"批准"，我将开始编写正式的设计文档。