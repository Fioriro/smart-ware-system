# SmartStock 实现任务列表

## 1. 项目初始化

- [x] 1.1 创建项目根目录结构
  - [x] 1.1.1 创建 backend 目录
  - [x] 1.1.2 创建 frontend 目录
  - [x] 1.1.3 创建 docs 目录

- [x] 1.2 后端项目初始化
  - [x] 1.2.1 初始化 npm 项目 (package.json)
  - [x] 1.2.2 安装核心依赖 (express, prisma, typescript, bcrypt, jsonwebtoken)
  - [x] 1.2.3 安装开发依赖 (ts-node, nodemon, @types/*, vitest)
  - [x] 1.2.4 配置 tsconfig.json
  - [x] 1.2.5 配置 ESLint + Prettier
  - [x] 1.2.6 创建 .env.development 环境变量文件

- [x] 1.3 前端项目初始化
  - [x] 1.3.1 使用 create-next-app 创建 Next.js 项目
  - [x] 1.3.2 安装额外依赖 (zustand, swr, axios, react-hook-form, zod)
  - [x] 1.3.3 配置 Tailwind CSS
  - [x] 1.3.4 创建 .env.development 环境变量文件

- [x] 1.4 创建后端目录结构
  - [x] 1.4.1 创建 src/core 目录 (DDD 核心模块)
  - [x] 1.4.2 创建 src/modules 目录 (MVC 简单模块)
  - [x] 1.4.3 创建 src/shared 目录 (共享代码)
  - [x] 1.4.4 创建 src/config 目录
  - [x] 1.4.5 创建 prisma 目录


## 2. 数据库设计与配置

- [x] 2.1 Prisma 配置
  - [x] 2.1.1 初始化 Prisma (npx prisma init)
  - [x] 2.1.2 配置数据库连接字符串
  - [x] 2.1.3 编写 schema.prisma 数据模型

- [x] 2.2 数据表定义
  - [x] 2.2.1 定义 users 表
  - [x] 2.2.2 定义 categories 表
  - [x] 2.2.3 定义 products 表 (含 version 乐观锁字段)
  - [x] 2.2.4 定义 suppliers 表
  - [x] 2.2.5 定义 inventory_transactions 表

- [x] 2.3 数据库迁移
  - [x] 2.3.1 生成迁移文件 (npx prisma migrate dev)
  - [x] 2.3.2 验证数据库表结构
  - [x] 2.3.3 生成 Prisma Client

## 3. 后端基础架构

- [x] 3.1 Express 应用配置
  - [x] 3.1.1 创建 app.ts 入口文件
  - [x] 3.1.2 配置中间件 (cors, json, urlencoded)
  - [x] 3.1.3 配置路由注册
  - [x] 3.1.4 配置全局错误处理
  - [x] 3.1.5 配置统一响应格式

- [x] 3.2 共享模块开发
  - [x] 3.2.1 创建 JWT 认证中间件
  - [x] 3.2.2 创建统一响应工具类
  - [x] 3.2.3 创建分页工具类
  - [x] 3.2.4 创建 ProductMapper (Prisma POJO → Domain Entity)
  - [x] 3.2.5 创建依赖注入容器


## 4. 用户认证模块 (MVC)

- [x] 4.1 用户模块基础
  - [x] 4.1.1 创建 user.model.ts
  - [x] 4.1.2 创建 user.service.ts
  - [x] 4.1.3 创建 user.controller.ts
  - [x] 4.1.4 注册用户路由

- [x] 4.2 认证功能实现
  - [x] 4.2.1 实现用户登录 API (POST /api/v1/auth/login)
  - [x] 4.2.2 实现用户登出 API (POST /api/v1/auth/logout)
  - [x] 4.2.3 实现获取当前用户 API (GET /api/v1/auth/me)
  - [x] 4.2.4 实现密码重置 API (POST /api/v1/auth/reset-password)

- [x] 4.3 用户管理功能
  - [x] 4.3.1 实现用户列表 API (GET /api/v1/users)
  - [x] 4.3.2 实现用户详情 API (GET /api/v1/users/:id)
  - [x] 4.3.3 实现创建用户 API (POST /api/v1/users)
  - [x] 4.3.4 实现更新用户 API (PUT /api/v1/users/:id)
  - [x] 4.3.5 实现删除用户 API (DELETE /api/v1/users/:id)

- [x] 4.4 用户模块单元测试
  - [x] 4.4.1 编写登录功能测试
  - [x] 4.4.2 编写用户 CRUD 测试

## 5. 商品分类模块 (MVC)

- [x] 5.1 分类模块基础
  - [x] 5.1.1 创建 category.model.ts
  - [x] 5.1.2 创建 category.service.ts
  - [x] 5.1.3 创建 category.controller.ts
  - [x] 5.1.4 注册分类路由

- [x] 5.2 分类功能实现
  - [x] 5.2.1 实现分类树查询 API (GET /api/v1/categories)
  - [x] 5.2.2 实现分类详情 API (GET /api/v1/categories/:id)
  - [x] 5.2.3 实现创建分类 API (POST /api/v1/categories)
  - [x] 5.2.4 实现更新分类 API (PUT /api/v1/categories/:id)
  - [x] 5.2.5 实现删除分类 API (DELETE /api/v1/categories/:id)

- [x] 5.3 分类模块单元测试
  - [x] 5.3.1 编写分类树构建测试
  - [x] 5.3.2 编写分类 CRUD 测试


## 6. 供应商模块 (MVC)

- [x] 6.1 供应商模块基础
  - [x] 6.1.1 创建 supplier.model.ts
  - [x] 6.1.2 创建 supplier.service.ts
  - [x] 6.1.3 创建 supplier.controller.ts
  - [x] 6.1.4 注册供应商路由

- [x] 6.2 供应商功能实现
  - [x] 6.2.1 实现供应商列表 API (GET /api/v1/suppliers)
  - [x] 6.2.2 实现供应商详情 API (GET /api/v1/suppliers/:id)
  - [x] 6.2.3 实现创建供应商 API (POST /api/v1/suppliers)
  - [x] 6.2.4 实现更新供应商 API (PUT /api/v1/suppliers/:id)
  - [x] 6.2.5 实现删除供应商 API (DELETE /api/v1/suppliers/:id)

- [x] 6.3 供应商模块单元测试
  - [x] 6.3.1 编写供应商 CRUD 测试

## 7. 商品管理模块 (DDD 核心)

- [x] 7.1 商品领域层
  - [x] 7.1.1 创建 Product 实体类 (充血模型)
  - [x] 7.1.2 创建 IProductRepository 接口
  - [x] 7.1.3 实现 Product.reconstruct 静态工厂方法
  - [x] 7.1.4 实现库存业务方法 (inbound, outbound, isLowStock)

- [x] 7.2 商品基础设施层
  - [x] 7.2.1 创建 ProductRepository 实现类
  - [x] 7.2.2 实现 findById, findBySku 方法
  - [x] 7.2.3 实现 findAll 分页查询方法
  - [x] 7.2.4 实现 findLowStock 低库存查询方法
  - [x] 7.2.5 实现 save 方法 (含乐观锁)

- [x] 7.3 商品应用层
  - [x] 7.3.1 创建 ProductService 应用服务
  - [x] 7.3.2 实现商品 CRUD 业务逻辑

- [x] 7.4 商品接口层
  - [x] 7.4.1 创建 ProductController
  - [x] 7.4.2 实现商品列表 API (GET /api/v1/products)
  - [x] 7.4.3 实现商品详情 API (GET /api/v1/products/:id)
  - [x] 7.4.4 实现 SKU 查询 API (GET /api/v1/products/sku/:sku)
  - [x] 7.4.5 实现低库存查询 API (GET /api/v1/products/low-stock)
  - [x] 7.4.6 实现创建商品 API (POST /api/v1/products)
  - [x] 7.4.7 实现更新商品 API (PUT /api/v1/products/:id)
  - [x] 7.4.8 实现删除商品 API (DELETE /api/v1/products/:id)

- [x] 7.5 商品模块单元测试
  - [x] 7.5.1 编写 Product 实体业务方法测试
  - [x] 7.5.2 编写 ProductRepository 测试
  - [x] 7.5.3 编写商品 API 集成测试


## 8. 库存管理模块 (DDD 核心)

- [x] 8.1 库存领域层
  - [x] 8.1.1 创建 InventoryTransaction 实体类
  - [x] 8.1.2 创建 ITransactionRepository 接口
  - [x] 8.1.3 实现静态工厂方法 (createInbound, createOutbound, createAdjustment)

- [x] 8.2 库存基础设施层
  - [x] 8.2.1 创建 TransactionRepository 实现类
  - [x] 8.2.2 实现 save 方法
  - [x] 8.2.3 实现 findByType 查询方法
  - [x] 8.2.4 实现 findByProductId 查询方法

- [x] 8.3 库存应用层
  - [x] 8.3.1 创建 InventoryService 应用服务
  - [x] 8.3.2 实现入库业务逻辑 (含事务控制)
  - [x] 8.3.3 实现出库业务逻辑 (含事务控制)
  - [x] 8.3.4 实现批量入库业务逻辑

- [x] 8.4 库存接口层
  - [x] 8.4.1 创建 InventoryController
  - [x] 8.4.2 实现单个入库 API (POST /api/v1/inventory/inbound)
  - [x] 8.4.3 实现批量入库 API (POST /api/v1/inventory/inbound/batch)
  - [x] 8.4.4 实现入库记录查询 API (GET /api/v1/inventory/inbound/records)
  - [x] 8.4.5 实现出库 API (POST /api/v1/inventory/outbound)
  - [x] 8.4.6 实现出库记录查询 API (GET /api/v1/inventory/outbound/records)

- [x] 8.5 库存模块单元测试
  - [x] 8.5.1 编写入库业务逻辑测试
  - [x] 8.5.2 编写出库业务逻辑测试 (含库存不足场景)
  - [x] 8.5.3 编写并发乐观锁测试

## 9. 审计日志模块 (MVC)

- [x] 9.1 日志模块基础
  - [x] 9.1.1 创建 log.model.ts
  - [x] 9.1.2 创建 log.service.ts
  - [x] 9.1.3 创建 log.controller.ts
  - [x] 9.1.4 注册日志路由

- [x] 9.2 日志功能实现
  - [x] 9.2.1 实现日志列表 API (GET /api/v1/logs)
  - [x] 9.2.2 实现日志导出 API (GET /api/v1/logs/export)
  - [x] 9.2.3 集成 Excel 导出库 (exceljs)

- [x] 9.3 日志模块单元测试
  - [x] 9.3.1 编写日志查询测试
  - [x] 9.3.2 编写 Excel 导出测试


## 10. 仪表盘模块 (MVC)

- [x] 10.1 仪表盘模块基础
  - [x] 10.1.1 创建 dashboard.service.ts
  - [x] 10.1.2 创建 dashboard.controller.ts
  - [x] 10.1.3 注册仪表盘路由

- [x] 10.2 仪表盘功能实现
  - [x] 10.2.1 实现统计数据 API (GET /api/v1/dashboard/stats)
  - [x] 10.2.2 实现商品总数统计
  - [x] 10.2.3 实现库存总量统计
  - [x] 10.2.4 实现低库存预警数量统计
  - [x] 10.2.5 实现今日入库/出库统计

## 11. 前端基础架构

- [x] 11.1 前端目录结构
  - [x] 11.1.1 创建 components/ui 目录
  - [x] 11.1.2 创建 components/layout 目录
  - [x] 11.1.3 创建 components/features 目录
  - [x] 11.1.4 创建 services 目录
  - [x] 11.1.5 创建 hooks 目录
  - [x] 11.1.6 创建 lib 目录
  - [x] 11.1.7 创建 styles 目录

- [x] 11.2 基础配置
  - [x] 11.2.1 配置 Axios 实例 (api.ts)
  - [x] 11.2.2 配置请求/响应拦截器
  - [x] 11.2.3 配置 Zustand 状态管理
  - [x] 11.2.4 创建设计规范常量 (design-tokens.ts)

- [x] 11.3 基础 UI 组件
  - [x] 11.3.1 创建 Button 组件
  - [x] 11.3.2 创建 Input 组件
  - [x] 11.3.3 创建 Card 组件 (玻璃拟态)
  - [x] 11.3.4 创建 Table 组件
  - [x] 11.3.5 创建 Modal 组件
  - [x] 11.3.6 创建 Pagination 组件

- [x] 11.4 布局组件
  - [x] 11.4.1 创建 Navbar 导航栏组件
  - [x] 11.4.2 创建 Layout 布局组件
  - [x] 11.4.3 配置 Next.js Middleware 路由守卫


## 12. 前端登录页面

- [x] 12.1 登录页面开发
  - [x] 12.1.1 创建登录页面 (/login)
  - [x] 12.1.2 实现登录表单 (用户名、密码)
  - [x] 12.1.3 集成 React Hook Form + Zod 验证
  - [x] 12.1.4 实现登录 API 调用
  - [x] 12.1.5 实现 Token 存储 (localStorage)
  - [x] 12.1.6 实现登录成功跳转

- [x] 12.2 认证状态管理
  - [x] 12.2.1 创建 auth.store.ts (Zustand)
  - [x] 12.2.2 实现 login/logout 方法
  - [x] 12.2.3 实现用户信息获取

## 13. 前端仪表盘页面

- [x] 13.1 仪表盘页面开发
  - [x] 13.1.1 创建仪表盘页面 (/dashboard)
  - [x] 13.1.2 实现统计卡片组件
  - [x] 13.1.3 实现低库存预警提示框
  - [x] 13.1.4 集成 SWR 数据获取
  - [x] 13.1.5 实现数据刷新功能

## 14. 前端商品管理页面

- [x] 14.1 商品列表页面
  - [x] 14.1.1 创建商品列表页面 (/products)
  - [x] 14.1.2 实现商品表格展示
  - [x] 14.1.3 实现低库存行高亮
  - [x] 14.1.4 实现分页功能
  - [x] 14.1.5 实现搜索功能 (SKU、名称)
  - [x] 14.1.6 实现分类筛选功能

- [x] 14.2 商品表单页面
  - [x] 14.2.1 创建新建商品页面 (/products/new)
  - [x] 14.2.2 创建编辑商品页面 (/products/:id/edit)
  - [x] 14.2.3 实现商品表单组件
  - [x] 14.2.4 实现分类下拉选择
  - [x] 14.2.5 实现表单验证

- [x] 14.3 商品删除功能
  - [x] 14.3.1 实现删除确认对话框
  - [x] 14.3.2 实现有库存商品二次确认


## 15. 前端商品分类页面

- [x] 15.1 分类管理页面
  - [x] 15.1.1 创建分类管理页面 (/categories)
  - [x] 15.1.2 实现分类树展示
  - [x] 15.1.3 实现展开/折叠功能
  - [x] 15.1.4 实现新建分类功能
  - [x] 15.1.5 实现编辑分类功能
  - [x] 15.1.6 实现删除分类功能

## 16. 前端供应商管理页面

- [x] 16.1 供应商列表页面
  - [x] 16.1.1 创建供应商列表页面 (/suppliers)
  - [x] 16.1.2 实现供应商表格展示
  - [x] 16.1.3 实现分页功能
  - [x] 16.1.4 实现搜索功能

- [x] 16.2 供应商表单页面
  - [x] 16.2.1 创建新建供应商页面 (/suppliers/new)
  - [x] 16.2.2 创建编辑供应商页面 (/suppliers/:id/edit)
  - [x] 16.2.3 实现供应商表单组件

## 17. 前端入库管理页面

- [x] 17.1 入库页面开发
  - [x] 17.1.1 创建入库管理页面 (/inbound)
  - [x] 17.1.2 实现单个入库表单
  - [x] 17.1.3 实现 SKU 输入自动匹配商品
  - [x] 17.1.4 实现供应商下拉选择
  - [x] 17.1.5 实现批量入库表格
  - [x] 17.1.6 实现动态添加/删除行
  - [x] 17.1.7 实现批量提交功能

- [x] 17.2 入库记录展示
  - [x] 17.2.1 实现入库记录列表
  - [x] 17.2.2 实现时间范围筛选
  - [x] 17.2.3 实现分页功能

## 18. 前端出库管理页面

- [x] 18.1 出库页面开发
  - [x] 18.1.1 创建出库管理页面 (/outbound)
  - [x] 18.1.2 实现出库表单
  - [x] 18.1.3 实现 SKU 输入自动匹配商品
  - [x] 18.1.4 实现当前库存显示
  - [x] 18.1.5 实现库存不足告警

- [x] 18.2 出库记录展示
  - [x] 18.2.1 实现出库记录列表
  - [x] 18.2.2 实现时间范围筛选
  - [x] 18.2.3 实现分页功能


## 19. 前端审计日志页面

- [ ] 19.1 审计日志页面开发
  - [ ] 19.1.1 创建审计日志页面 (/logs)
  - [ ] 19.1.2 实现日志表格展示
  - [ ] 19.1.3 实现时间范围筛选
  - [ ] 19.1.4 实现操作类型筛选
  - [ ] 19.1.5 实现 SKU/操作人搜索
  - [ ] 19.1.6 实现分页功能
  - [ ] 19.1.7 实现 Excel 导出功能

## 20. 前端用户管理页面

- [ ] 20.1 用户管理页面开发
  - [ ] 20.1.1 创建用户管理页面 (/users)
  - [ ] 20.1.2 实现用户表格展示
  - [ ] 20.1.3 实现新建用户功能
  - [ ] 20.1.4 实现编辑用户功能
  - [ ] 20.1.5 实现禁用/启用用户功能
  - [ ] 20.1.6 实现删除用户功能

## 21. 库存预警功能

- [ ] 21.1 预警功能实现
  - [ ] 21.1.1 创建 alert.store.ts (Zustand)
  - [ ] 21.1.2 实现登录后低库存检查
  - [ ] 21.1.3 实现低库存弹窗提醒
  - [ ] 21.1.4 实现"查看详情"跳转
  - [ ] 21.1.5 实现"稍后提醒"功能

## 22. 集成测试与优化

- [ ] 22.1 端到端测试
  - [ ] 22.1.1 配置测试环境
  - [ ] 22.1.2 编写登录流程测试
  - [ ] 22.1.3 编写入库流程测试
  - [ ] 22.1.4 编写出库流程测试

- [ ] 22.2 性能优化
  - [ ] 22.2.1 添加 API 响应缓存
  - [ ] 22.2.2 优化数据库查询
  - [ ] 22.2.3 添加前端加载状态

## 23. 部署准备

- [ ] 23.1 生产环境配置
  - [ ] 23.1.1 创建 .env.production 配置
  - [ ] 23.1.2 配置生产数据库连接
  - [ ] 23.1.3 配置 JWT 密钥

- [ ] 23.2 构建与部署
  - [ ] 23.2.1 后端构建脚本
  - [ ] 23.2.2 前端构建脚本
  - [ ] 23.2.3 编写启动脚本

---

## 任务说明

- 任务按照依赖关系排序，建议按顺序执行
- 每个主任务完成后，需要在 `docs/CHANGELOG.md` 中记录总结
- DDD 核心模块（商品、库存）需要严格遵循领域驱动设计原则
- MVC 模块（用户、供应商、分类、日志、仪表盘）采用简单的三层架构
- 所有 API 需要编写单元测试

## 当前进度

**后端开发**：已完成 10/10 模块
- ✅ 项目初始化
- ✅ 数据库设计与配置
- ✅ 后端基础架构
- ✅ 用户认证模块
- ✅ 商品分类模块
- ✅ 供应商模块
- ✅ 商品管理模块 (DDD)
- ✅ 库存管理模块 (DDD)
- ✅ 审计日志模块
- ✅ 仪表盘模块

**前端开发**：待开始
- ⏳ 前端基础架构
- ⏳ 登录页面
- ⏳ 仪表盘页面
- ⏳ 商品管理页面
- ⏳ 分类管理页面
- ⏳ 供应商管理页面
- ⏳ 入库管理页面
- ⏳ 出库管理页面
- ⏳ 审计日志页面
- ⏳ 用户管理页面
- ⏳ 库存预警功能

**下一步建议**：开始前端开发（任务 11-21）
