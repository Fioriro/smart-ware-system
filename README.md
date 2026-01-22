# SmartStock - 智能仓储管理系统

一个基于 Next.js + Express + Prisma 的现代化仓储管理系统，采用 DDD（领域驱动设计）架构。

## 功能特性

- 📦 **商品管理** - 商品信息维护、分类管理、库存追踪
- 📥 **入库管理** - 单个/批量入库、供应商管理、入库记录查询
- 📤 **出库管理** - 商品出库、库存不足告警、出库记录查询
- 📊 **仪表盘** - 实时库存统计、低库存预警、今日出入库统计
- 📝 **审计日志** - 完整的操作记录、Excel 导出
- 👥 **用户管理** - 用户权限管理、角色分配
- 🔐 **认证授权** - JWT Token 认证、路由守卫

## 技术栈

### 后端
- **框架**: Express.js + TypeScript
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT (jsonwebtoken)
- **测试**: Vitest + Supertest
- **架构**: DDD（领域驱动设计）+ MVC

### 前端
- **框架**: Next.js 16 (App Router) + React 19
- **状态管理**: Zustand + SWR
- **表单**: React Hook Form + Zod
- **样式**: Tailwind CSS 4
- **UI 设计**: 玻璃拟态（Glass Morphism）

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm >= 9.0.0

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd smart-stock
```

2. **配置环境变量**

后端配置 (`backend/.env.development`):
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_ware_system
DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/smart_ware_system"

# JWT 配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3001
NODE_ENV=development
```

前端配置 (`frontend/.env.development`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=SmartStock
NEXT_PUBLIC_APP_VERSION=1.0.0
```

3. **安装依赖**
```bash
# 后端依赖
cd backend
npm install

# 前端依赖
cd ../frontend
npm install
```

4. **数据库迁移**
```bash
cd backend
npm run prisma:migrate:dev
npm run prisma:generate
```

5. **启动项目**

**方式一：使用启动脚本**
```bash
# Linux/Mac
chmod +x start.sh
./start.sh dev

# Windows
start.bat dev
```

**方式二：手动启动（推荐用于开发）**
```bash
# 启动后端（终端1）
cd backend
npm run dev

# 启动前端（终端2）
cd frontend
npm run dev
```

> 💡 **提示**：如果启动脚本遇到问题，推荐使用手动启动方式。详见 [DEPLOYMENT.md](DEPLOYMENT.md)

6. **访问应用**
- 前端地址: http://localhost:3000
- 后端地址: http://localhost:3001
- API 文档: http://localhost:3001/api/v1

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
smart-stock/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── core/           # DDD 核心模块（商品、库存）
│   │   │   ├── product/
│   │   │   │   ├── domain/        # 领域层（实体、仓储接口）
│   │   │   │   ├── application/   # 应用层（服务）
│   │   │   │   ├── infrastructure/# 基础设施层（仓储实现）
│   │   │   │   └── interfaces/    # 接口层（控制器、路由）
│   │   │   └── inventory/
│   │   ├── modules/        # MVC 模块（用户、分类、供应商等）
│   │   ├── shared/         # 共享代码（中间件、工具类）
│   │   └── tests/          # 测试文件
│   ├── prisma/             # Prisma 配置和迁移
│   └── package.json
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── app/           # Next.js App Router 页面
│   │   ├── components/    # React 组件
│   │   │   ├── ui/       # 基础 UI 组件
│   │   │   ├── features/ # 业务组件
│   │   │   └── layout/   # 布局组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── services/     # API 服务
│   │   └── stores/       # 状态管理
│   └── package.json
├── docs/                  # 文档
├── start.sh              # Linux/Mac 启动脚本
├── start.bat             # Windows 启动脚本
├── stop.sh               # 停止脚本
└── README.md
```

## 开发指南

### 后端开发

```bash
cd backend

# 开发模式
npm run dev

# 构建
npm run build

# 运行测试
npm run test              # 单元测试
npm run test:integration  # 集成测试

# 数据库操作
npm run prisma:migrate:dev    # 创建迁移
npm run prisma:generate       # 生成 Prisma Client
npm run prisma:studio         # 打开 Prisma Studio
```

### 前端开发

```bash
cd frontend

# 开发模式
npm run dev

# 构建
npm run build
npm run build:prod        # 生产环境构建

# 代码检查
npm run lint
npm run typecheck
npm run validate          # 类型检查 + ESLint
```

## 测试

### 后端测试

```bash
cd backend

# 运行所有单元测试
npm run test

# 运行集成测试
npm run test:integration

# 运行特定测试文件
npm run test product.test.ts
npm run test:integration auth.integration.test.ts

# 测试覆盖率
npm run test:coverage
```

**测试统计：**
- 单元测试：60+ 个测试用例
- 集成测试：119 个测试用例
  - 登录流程：35 个测试
  - 入库流程：38 个测试
  - 出库流程：29 个测试
  - 缓存中间件：17 个测试

## 生产部署

### 1. 配置生产环境变量

复制并修改生产环境配置：
```bash
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
```

修改配置文件中的占位符为实际值。

### 2. 构建项目

```bash
# 后端构建
cd backend
npm run build

# 前端构建
cd frontend
npm run build:prod
```

### 3. 数据库迁移

```bash
cd backend
npm run prisma:migrate:prod
```

### 4. 启动生产服务器

**方式一：使用启动脚本**
```bash
# Linux/Mac
./start.sh prod

# Windows
start.bat prod
```

**方式二：手动启动**
```bash
# 后端
cd backend
npm run start:prod

# 前端
cd frontend
npm run start:prod
```

### Docker 部署（可选）

```bash
# 构建独立模式
cd frontend
npm run build:standalone

# 使用 Docker Compose
docker-compose up -d
```

## API 文档

### 认证相关
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户信息

### 商品管理
- `GET /api/v1/products` - 商品列表
- `GET /api/v1/products/:id` - 商品详情
- `POST /api/v1/products` - 创建商品
- `PUT /api/v1/products/:id` - 更新商品
- `DELETE /api/v1/products/:id` - 删除商品
- `GET /api/v1/products/low-stock` - 低库存商品

### 库存管理
- `POST /api/v1/inventory/inbound` - 单个入库
- `POST /api/v1/inventory/inbound/batch` - 批量入库
- `GET /api/v1/inventory/inbound/records` - 入库记录
- `POST /api/v1/inventory/outbound` - 商品出库
- `GET /api/v1/inventory/outbound/records` - 出库记录

### 其他模块
- 分类管理: `/api/v1/categories`
- 供应商管理: `/api/v1/suppliers`
- 用户管理: `/api/v1/users`
- 审计日志: `/api/v1/logs`
- 仪表盘: `/api/v1/dashboard/stats`

## 性能优化

- ✅ API 响应缓存（内存缓存 + TTL 过期）
- ✅ 数据库索引优化
- ✅ 查询优化（并行查询、select 优化）
- ✅ 前端骨架屏加载状态
- ✅ 生产环境移除 console.log
- ✅ Next.js 图片优化
- ✅ React Compiler 优化

## 安全特性

- JWT Token 认证
- 密码 bcrypt 加密
- SQL 注入防护（Prisma ORM）
- XSS 防护
- CORS 配置
- 移除 X-Powered-By 响应头
- 环境变量隔离

## 常见问题

### 1. 数据库连接失败
检查 `backend/.env.development` 中的数据库配置是否正确。

### 2. 端口被占用
修改 `backend/.env.development` 中的 `PORT` 和 `frontend/.env.development` 中的 `NEXT_PUBLIC_API_URL`。

### 3. Prisma Client 未生成
运行 `cd backend && npm run prisma:generate`。

### 4. 前端构建失败
清理缓存：`cd frontend && npm run clean && npm run build`。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- 项目地址: <repository-url>
- 问题反馈: <issues-url>

---

**SmartStock** - 让仓储管理更智能 🚀
