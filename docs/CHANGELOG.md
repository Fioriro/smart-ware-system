# SmartStock 项目变更日志

## [2026-01-22] 18. 前端出库管理页面

### 执行概要
- **任务编号**：18.1 - 18.2
- **执行时间**：前端出库管理页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端出库管理页面的完整实现，包括：
- 出库管理页面 (/outbound)：出库表单、出库记录列表
- 出库表单组件 (OutboundForm)：
  - SKU 输入自动匹配商品（防抖 300ms）
  - 当前库存突出显示（大字体、颜色区分）
  - 库存不足告警（红色警告框、禁用提交按钮）
  - 数量输入、备注输入
- 出库记录列表：表格展示、时间范围筛选、分页功能
- 复用已有的 inventory.service.ts 和 useOutboundRecords Hook

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/outbound/page.tsx | 出库管理页面（出库表单、记录列表） |
| 新增 | frontend/src/components/features/OutboundForm.tsx | 出库表单组件（SKU 匹配、库存显示、不足告警） |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务 18 状态为已完成 |

### 关键代码/配置

**页面路由：**
- 出库管理：`/outbound`
- 支持 URL 参数：`/outbound?sku=XXX`（从商品列表跳转）

**API 端点：**
- `POST /api/v1/inventory/outbound` - 商品出库
- `GET /api/v1/inventory/outbound/records` - 出库记录列表（分页、筛选）

**功能特性：**
- SKU 输入防抖（300ms）自动匹配商品
- 当前库存突出显示（大字体、绿色/红色区分）
- 低库存预警徽章（当商品处于低库存状态时显示）
- 库存不足告警：
  - 红色警告框显示详细信息
  - 数量输入框红色边框
  - 提交按钮禁用
- 出库记录支持时间范围筛选
- 出库数量显示为红色负数（-N）
- 玻璃拟态 UI 设计风格

**表单验证 Schema (Zod)：**
```typescript
const outboundSchema = z.object({
  sku: z.string().min(1, 'SKU不能为空'),
  quantity: z.number().min(1, '出库数量必须大于0'),
  remark: z.string().optional(),
});
```

**库存不足判断逻辑：**
```typescript
const isStockInsufficient = product ? quantity > product.quantity : false;
```

**表格列：** 时间、SKU、商品名称、数量、操作人、备注

### 遗留问题
无

### 下一步
执行任务 19：前端审计日志页面

---

## [2026-01-22] 17. 前端入库管理页面

### 执行概要
- **任务编号**：17.1 - 17.2
- **执行时间**：前端入库管理页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端入库管理页面的完整实现，包括：
- 入库管理页面 (/inbound)：Tab 切换（单个入库/批量入库）
- 单个入库表单：SKU 输入自动匹配商品（防抖 300ms）、供应商下拉选择、数量输入、备注
- 批量入库表格：动态添加/删除行、SKU 自动匹配、批量提交
- 入库记录列表：表格展示、时间范围筛选、分页功能
- 库存 API 服务 (inventory.service.ts)
- useInboundRecords、useOutboundRecords 自定义 Hooks
- InboundForm 单个入库表单组件
- BatchInboundTable 批量入库表格组件

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/inbound/page.tsx | 入库管理页面（Tab 切换、入库表单、记录列表） |
| 新增 | frontend/src/services/inventory.service.ts | 库存 API 服务（入库、批量入库、出库、记录查询） |
| 新增 | frontend/src/hooks/useInventory.ts | 库存数据 Hooks（useInboundRecords、useOutboundRecords） |
| 新增 | frontend/src/components/features/InboundForm.tsx | 单个入库表单组件（SKU 自动匹配、供应商选择） |
| 新增 | frontend/src/components/features/BatchInboundTable.tsx | 批量入库表格组件（动态行、批量提交） |
| 修改 | frontend/src/hooks/index.ts | 导出库存相关 Hooks |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务 17 状态为已完成 |

### 关键代码/配置

**页面路由：**
- 入库管理：`/inbound`
- 支持 URL 参数：`/inbound?sku=XXX`（从商品列表补货跳转）

**API 端点：**
- `POST /api/v1/inventory/inbound` - 单个入库
- `POST /api/v1/inventory/inbound/batch` - 批量入库
- `GET /api/v1/inventory/inbound/records` - 入库记录列表（分页、筛选）

**功能特性：**
- SKU 输入防抖（300ms）自动匹配商品
- 批量入库支持动态添加/删除行
- 入库记录支持时间范围筛选
- 玻璃拟态 UI 设计风格

### 遗留问题
无

### 下一步
执行任务 18：前端出库管理页面

---

## [2026-01-22] 16. 前端供应商管理页面

### 执行概要
- **任务编号**：16.1 - 16.2
- **执行时间**：前端供应商管理页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端供应商管理页面的完整实现，包括：
- 供应商列表页面 (/suppliers)：表格展示、分页、搜索功能
- 新建供应商页面 (/suppliers/new)：供应商表单、Zod 表单验证
- 编辑供应商页面 (/suppliers/:id/edit)：加载供应商数据、编辑表单、编码只读
- 删除功能：删除确认对话框、错误提示（有关联入库记录时禁止删除）
- 供应商 API 服务 (supplier.service.ts)
- useSuppliers、useSupplier、useAllSuppliers 自定义 Hooks
- SupplierForm 表单组件

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/suppliers/page.tsx | 供应商列表页面（表格、搜索、分页、删除） |
| 新增 | frontend/src/app/suppliers/new/page.tsx | 新建供应商页面 |
| 新增 | frontend/src/app/suppliers/[id]/edit/page.tsx | 编辑供应商页面 |
| 新增 | frontend/src/services/supplier.service.ts | 供应商 API 服务 |
| 新增 | frontend/src/hooks/useSuppliers.ts | 供应商数据 Hooks（useSuppliers、useSupplier、useAllSuppliers） |
| 新增 | frontend/src/components/features/SupplierForm.tsx | 供应商表单组件（React Hook Form + Zod） |
| 修改 | frontend/src/hooks/index.ts | 导出供应商相关 Hooks |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务 16 状态为已完成 |

### 关键代码/配置

**页面路由：**
- 供应商列表：`/suppliers`
- 新建供应商：`/suppliers/new`
- 编辑供应商：`/suppliers/:id/edit`

**API 端点：**
- `GET /api/v1/suppliers` - 供应商列表（分页、搜索）
- `GET /api/v1/suppliers/:id` - 供应商详情
- `POST /api/v1/suppliers` - 创建供应商
- `PUT /api/v1/suppliers/:id` - 更新供应商（编码只读）
- `DELETE /api/v1/suppliers/:id` - 删除供应商（软删除）

**表单验证 Schema (Zod)：**
```typescript
const supplierSchema = z.object({
  code: z.string().min(1, '供应商编码不能为空'),
  name: z.string().min(1, '供应商名称不能为空'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
```

**供应商数据结构：**
```typescript
interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**表格列：** 编码、名称、联系人、电话、地址、操作

**设计特点：**
- 玻璃拟态（Glass Morphism）卡片效果
- 电话号码可点击拨打
- 地址过长时截断显示（悬停显示完整）
- 搜索支持编码和名称模糊匹配
- 删除时显示错误信息（如有关联入库记录）

### 遗留问题
无

### 下一步
执行任务 17：前端入库管理页面

---

## [2026-01-22] 15. 前端商品分类页面

### 执行概要
- **任务编号**：15.1.1 - 15.1.6
- **执行时间**：前端商品分类页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端商品分类管理页面的完整实现，包括：
- 分类管理页面 (/categories)：树形结构展示、展开/折叠功能
- CategoryTree 组件：递归树形展示、全部展开/折叠、商品数量徽章
- CategoryForm 组件：新建/编辑分类表单、父分类下拉选择、Zod 表单验证
- 新建分类功能：支持创建顶级分类和子分类
- 编辑分类功能：修改分类名称和父分类（防止设为自己的子分类）
- 删除分类功能：删除确认对话框、业务规则校验（有子分类/商品时禁止删除）

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/categories/page.tsx | 分类管理页面（树形展示、CRUD 操作） |
| 新增 | frontend/src/components/features/CategoryTree.tsx | 分类树组件（递归渲染、展开/折叠） |
| 新增 | frontend/src/components/features/CategoryForm.tsx | 分类表单组件（React Hook Form + Zod） |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务 15 状态为已完成 |

### 关键代码/配置

**页面路由：** `/categories`

**API 端点：**
- `GET /api/v1/categories` - 获取分类树
- `GET /api/v1/categories/:id` - 获取分类详情
- `POST /api/v1/categories` - 创建分类
- `PUT /api/v1/categories/:id` - 更新分类
- `DELETE /api/v1/categories/:id` - 删除分类

**表单验证 Schema (Zod)：**
```typescript
const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(100, '分类名称不能超过100个字符'),
  parentId: z.number().nullable(),
});
```

**分类树 UI 设计：**
```
▼ 电子产品 (0件商品)              [+子分类] [编辑] [删除]
    ▼ 手机 (10件商品)             [+子分类] [编辑] [删除]
        iPhone (5件商品)          [+子分类] [编辑] [删除]
        Android (5件商品)         [+子分类] [编辑] [删除]
    ▶ 电脑 (20件商品)             [+子分类] [编辑] [删除]
▼ 服装 (15件商品)                 [+子分类] [编辑] [删除]
```

**业务规则：**
- 不能删除有子分类的分类
- 不能删除有关联商品的分类
- 编辑时不能将分类设为自己或其子分类的子分类
- 同级分类名称唯一性由后端校验

**设计特点：**
- 玻璃拟态（Glass Morphism）卡片效果
- 树形缩进展示层级关系
- 文件夹图标区分展开/折叠状态
- 商品数量徽章（蓝色/灰色区分有无商品）
- 操作按钮悬停显示
- 全部展开/折叠工具栏
- 空状态友好提示

### 遗留问题
无

### 下一步
执行任务 16：前端供应商管理页面

---

## [2026-01-22] 14. 前端商品管理页面

### 执行概要
- **任务编号**：14.1 - 14.3
- **执行时间**：前端商品管理页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端商品管理页面的完整实现，包括：
- 商品列表页面 (/products)：表格展示、低库存行高亮、分页、搜索、分类筛选
- 新建商品页面 (/products/new)：商品表单、分类下拉选择、Zod 表单验证
- 编辑商品页面 (/products/:id/edit)：加载商品数据、编辑表单、SKU 只读
- 删除功能：删除确认对话框、有库存商品二次确认
- 商品 API 服务和分类 API 服务
- useProducts、useCategories、useProduct 自定义 Hooks

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/products/page.tsx | 商品列表页面（表格、筛选、分页、删除） |
| 新增 | frontend/src/app/products/new/page.tsx | 新建商品页面 |
| 新增 | frontend/src/app/products/[id]/edit/page.tsx | 编辑商品页面 |
| 新增 | frontend/src/services/product.service.ts | 商品 API 服务 |
| 新增 | frontend/src/services/category.service.ts | 分类 API 服务 |
| 新增 | frontend/src/hooks/useProducts.ts | 商品数据 Hooks（useProducts、useCategories、useProduct） |
| 新增 | frontend/src/components/features/ProductForm.tsx | 商品表单组件（React Hook Form + Zod） |
| 修改 | frontend/src/hooks/index.ts | 导出商品相关 Hooks |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务 14 状态为已完成 |

### 关键代码/配置

**页面路由：**
- 商品列表：`/products`
- 新建商品：`/products/new`
- 编辑商品：`/products/:id/edit`

**API 端点：**
- `GET /api/v1/products` - 商品列表（分页、搜索、筛选）
- `GET /api/v1/products/:id` - 商品详情
- `POST /api/v1/products` - 创建商品
- `PUT /api/v1/products/:id` - 更新商品
- `DELETE /api/v1/products/:id` - 删除商品
- `GET /api/v1/categories` - 分类树

**表单验证 Schema (Zod)：**
```typescript
const productSchema = z.object({
  sku: z.string().min(1, 'SKU不能为空'),
  name: z.string().min(1, '商品名称不能为空'),
  categoryId: z.number().min(1, '请选择分类'),
  unit: z.string().min(1, '单位不能为空'),
  quantity: z.number().min(0, '库存不能为负数'),
  minThreshold: z.number().min(0, '预警阈值不能为负数'),
  costPrice: z.number().min(0, '成本价不能为负数').nullable(),
  salePrice: z.number().min(0, '销售价不能为负数').nullable(),
});
```

**低库存行高亮：** 使用 TableRow 的 `danger` 属性，当 `product.isLowStock` 为 true 时显示红色背景

### 遗留问题
无

### 下一步
执行任务 15：前端商品分类页面

---

## [2026-01-22] 13. 前端仪表盘页面

### 执行概要
- **任务编号**：13.1.1 - 13.1.5
- **执行时间**：前端仪表盘页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端仪表盘页面的完整实现，包括：
- 仪表盘页面 (/dashboard)
- 5个统计卡片组件（商品总数、库存总量、低库存预警、今日入库、今日出库）
- 低库存预警提示框（页面底部横幅）
- 低库存预警弹窗（登录后首次显示）
- SWR 数据获取（自动刷新、窗口聚焦刷新）
- 数据刷新按钮
- 加载骨架屏
- 错误提示

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/dashboard/page.tsx | 仪表盘页面组件（统计卡片、预警提示） |
| 新增 | frontend/src/services/dashboard.service.ts | 仪表盘 API 服务 |
| 新增 | frontend/src/hooks/useDashboard.ts | 仪表盘数据 Hook（SWR 集成） |
| 修改 | frontend/src/hooks/index.ts | 导出 useDashboard Hook |
| 修改 | .kiro/specs/smart-stock/tasks.md | 更新任务状态为已完成 |

### 关键代码/配置

**仪表盘页面路由：** `/dashboard`

**API 端点：** `GET /api/v1/dashboard/stats`

**SWR 配置：**
```typescript
useSWR('/dashboard/stats', fetcher, {
  refreshInterval: 60000, // 每分钟自动刷新
  revalidateOnFocus: true, // 窗口聚焦时重新验证
  revalidateOnReconnect: true, // 网络重连时重新验证
  dedupingInterval: 5000, // 5秒内重复请求去重
});
```

**统计卡片设计：**
1. 商品总数 - 蓝色图标 (PackageIcon)
2. 库存总量 - 绿色图标 (ChartIcon)
3. 低库存预警 - 红色图标 (AlertIcon)，可点击跳转
4. 今日入库 - 紫色图标 (PlusIcon)，绿色数值
5. 今日出库 - 橙色图标 (MinusIcon)，红色数值

**低库存预警功能：**
- 登录后自动检查低库存数量
- 首次显示弹窗提醒
- 点击"查看详情"跳转到 `/products?lowStock=true`
- 点击"稍后提醒"关闭弹窗（本次会话不再显示）
- 页面底部始终显示预警横幅（当有低库存商品时）

**设计特点：**
- 玻璃拟态（Glass Morphism）卡片效果
- 统计卡片悬停上浮动画
- 低库存卡片左侧红色边框高亮
- 加载骨架屏动画
- 响应式网格布局

### 遗留问题
无

### 下一步
执行任务 14：前端商品管理页面

---

## [2026-01-22] 12. 前端登录页面

### 执行概要
- **任务编号**：12.1 - 12.2
- **执行时间**：前端登录页面开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端登录页面的完整实现，包括：
- 登录页面 UI（玻璃拟态设计风格）
- 登录表单（用户名、密码输入）
- React Hook Form + Zod 表单验证
- 登录 API 调用（集成后端认证接口）
- Token 存储（localStorage + Cookie）
- 登录成功后跳转到仪表盘
- 认证服务（auth.service.ts）
- 认证 Hook（useAuth.ts）

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/app/login/page.tsx | 登录页面组件（玻璃拟态设计） |
| 新增 | frontend/src/services/auth.service.ts | 认证服务（登录、登出、获取用户信息 API） |
| 新增 | frontend/src/hooks/useAuth.ts | 认证 Hook（封装登录、登出、状态管理） |
| 修改 | frontend/src/hooks/index.ts | 导出 useAuth Hook |
| 修改 | frontend/src/services/api.ts | 修复 POST/PUT 方法类型定义 |
| 修改 | frontend/src/components/ui/Input.tsx | 使用 useId 修复 hydration 问题 |

### 关键代码/配置

**登录页面路由：** `/login`

**登录表单验证（Zod）：**
```typescript
const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});
```

**登录流程：**
1. 用户输入用户名和密码
2. 表单验证（Zod + React Hook Form）
3. 调用 POST /api/v1/auth/login
4. 成功后：
   - 存储 Token 到 localStorage
   - 存储 Token 到 Cookie（用于 middleware 路由守卫）
   - 更新 Zustand auth store
   - 跳转到 /dashboard（或 redirect 参数指定的页面）
5. 失败后：
   - 显示错误信息
   - 清空密码字段

**认证服务 API：**
- `authService.login(credentials)` - 用户登录
- `authService.logout()` - 用户登出
- `authService.getCurrentUser()` - 获取当前用户信息
- `authService.resetPassword(username, newPassword)` - 重置密码

**设计特点：**
- 玻璃拟态（Glass Morphism）卡片效果
- 渐变背景装饰
- Logo + 品牌名称
- 密码显示/隐藏切换
- 加载状态显示
- 错误信息提示
- 响应式设计

**测试账号：**
- 用户名：admin
- 密码：admin123

### 遗留问题
- 错误信息显示存在 React hydration 相关的状态同步问题，错误信息会短暂显示后消失。核心登录功能正常工作，此问题可在后续优化中解决。

### 下一步
执行任务 13：前端仪表盘页面

---


## [2026-01-22] 11. 前端基础架构

### 执行概要
- **任务编号**：11.1 - 11.4
- **执行时间**：前端基础架构开发阶段
- **执行状态**：成功

### 完成内容
完成了 SmartStock 前端基础架构的完整实现，包括：
- 前端目录结构（components/ui、components/layout、components/features、services、hooks、lib、styles）
- 基础配置（Axios 实例、请求/响应拦截器、Zustand 状态管理、设计规范常量）
- 基础 UI 组件（Button、Input、Card、Table、Modal、Pagination）
- 布局组件（Navbar 导航栏、Layout 布局）
- Next.js Middleware 路由守卫

### 文件变更

| 操作 | 文件路径 | 说明 |
|------|----------|------|
| 新增 | frontend/src/components/ui/Button.tsx | 按钮组件（primary/secondary/danger/ghost 变体） |
| 新增 | frontend/src/components/ui/Input.tsx | 输入框组件（含密码显示切换） |
| 新增 | frontend/src/components/ui/Card.tsx | 卡片组件（玻璃拟态效果） |
| 新增 | frontend/src/components/ui/Table.tsx | 表格组件（排序、加载、空状态） |
| 新增 | frontend/src/components/ui/Modal.tsx | 模态框组件（含确认对话框） |
| 新增 | frontend/src/components/ui/Pagination.tsx | 分页组件 |
| 新增 | frontend/src/components/ui/index.ts | UI 组件统一导出 |
| 新增 | frontend/src/components/layout/Navbar.tsx | 导航栏组件（含下拉菜单、用户菜单） |
| 新增 | frontend/src/components/layout/Layout.tsx | 布局组件（页面容器、页面区块） |
| 新增 | frontend/src/components/layout/index.ts | 布局组件统一导出 |
| 新增 | frontend/src/components/features/.gitkeep | 业务组件目录占位 |
| 新增 | frontend/src/services/api.ts | Axios 实例配置（含拦截器） |
| 新增 | frontend/src/hooks/index.ts | 自定义 Hooks（useApi、usePagination、useDebounce 等） |
| 新增 | frontend/src/stores/index.ts | Zustand 状态管理（auth、ui、alert） |
| 新增 | frontend/src/lib/design-tokens.ts | 设计规范常量（颜色、阴影、间距等） |
| 新增 | frontend/src/styles/globals.css | 全局样式（玻璃拟态、动画、滚动条等） |
| 新增 | frontend/src/middleware.ts | Next.js 路由守卫（JWT 认证检查） |
| 修改 | frontend/src/app/layout.tsx | 更新根布局（中文、新字体、新样式） |

### 关键代码/配置

**Axios 配置：**
- 基础 URL：`http://localhost:3001/api/v1`
- 请求拦截器：自动添加 JWT Token
- 响应拦截器：401 错误自动跳转登录页

**Zustand 状态管理：**
- `useAuthStore`：认证状态（token、user、登录/登出）
- `useUIStore`：UI 状态（侧边栏开关）
- `useAlertStore`：低库存预警状态

**设计规范（Glass Morphism）：**
- 主色调：`#3B82F6`（蓝色）
- 背景渐变：`linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 100%)`
- 卡片背景：`rgba(255, 255, 255, 0.7)` + `backdrop-blur(10px)`
- 圆角：`16px`

### 遗留问题
- Next.js 16 中 middleware 文件约定已弃用，建议使用 proxy。当前实现仍可正常工作，后续版本可能需要迁移。

### 下一步
执行任务 12：前端登录页面

---
