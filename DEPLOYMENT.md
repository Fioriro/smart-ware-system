# SmartStock 部署指南

## 快速启动

### Windows 用户

1. **启动开发环境**
```cmd
start.bat dev
```

2. **启动生产环境**
```cmd
start.bat prod
```

### Linux/Mac 用户

1. **添加执行权限**
```bash
chmod +x start.sh stop.sh
```

2. **启动开发环境**
```bash
./start.sh dev
```

3. **启动生产环境**
```bash
./start.sh prod
```

4. **停止服务**
```bash
./stop.sh
```

## 手动启动（推荐用于开发）

如果启动脚本遇到问题，可以手动启动：

### 1. 启动后端

```cmd
cd backend
npm run dev
```

后端将在 http://localhost:3001 启动

### 2. 启动前端（新终端）

```cmd
cd frontend
npm run dev
```

前端将在 http://localhost:3000 启动

## 首次运行前的准备

### 1. 配置数据库

编辑 `backend/.env.development` 文件：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=smart_ware_system
DATABASE_URL="mysql://your_db_user:your_db_password@localhost:3306/smart_ware_system"
```

### 2. 运行数据库迁移

```cmd
cd backend
npm run prisma:migrate:dev
npm run prisma:generate
```

### 3. 创建初始管理员账户

数据库迁移会自动创建默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 生产环境部署

### 1. 配置生产环境变量

复制并编辑生产环境配置：

```cmd
copy backend\.env.example backend\.env.production
copy frontend\.env.example frontend\.env.production
```

编辑 `.env.production` 文件，替换所有占位符为实际值。

### 2. 构建项目

```cmd
REM 后端构建
cd backend
npm run build

REM 前端构建
cd ..\frontend
npm run build:prod
```

### 3. 运行数据库迁移

```cmd
cd backend
npm run prisma:migrate:prod
```

### 4. 启动生产服务器

```cmd
REM 后端
cd backend
npm run start:prod

REM 前端（新终端）
cd frontend
npm run start:prod
```

## 常见问题

### 1. 端口被占用

如果端口 3000 或 3001 被占用，可以修改端口：

**后端端口**：编辑 `backend/.env.development`
```env
PORT=3002
```

**前端 API 地址**：编辑 `frontend/.env.development`
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
```

### 2. 数据库连接失败

检查：
- MySQL 服务是否运行
- 数据库用户名和密码是否正确
- 数据库是否已创建

### 3. Prisma Client 未生成

运行：
```cmd
cd backend
npm run prisma:generate
```

### 4. 前端构建失败

清理缓存后重新构建：
```cmd
cd frontend
npm run clean
npm run build
```

### 5. 启动脚本报错

使用手动启动方式：
1. 打开两个终端窗口
2. 第一个终端：`cd backend && npm run dev`
3. 第二个终端：`cd frontend && npm run dev`

## 访问应用

- **前端地址**: http://localhost:3000
- **后端地址**: http://localhost:3001
- **默认账号**: admin / admin123

## 停止服务

### Windows
关闭命令行窗口即可停止服务

### Linux/Mac
```bash
./stop.sh
```

或按 `Ctrl+C` 停止当前终端的服务

## Docker 部署（可选）

### 1. 构建独立模式

```cmd
cd frontend
npm run build:standalone
```

### 2. 使用 Docker Compose

```cmd
docker-compose up -d
```

## 性能优化建议

1. **生产环境使用 PM2**
```cmd
npm install -g pm2
pm2 start backend/dist/app.js --name smartstock-backend
pm2 start npm --name smartstock-frontend -- run start:prod
```

2. **使用 Nginx 反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

3. **启用 HTTPS**
使用 Let's Encrypt 获取免费 SSL 证书

## 监控和日志

### 查看日志

**开发环境**：
- 后端日志：终端输出
- 前端日志：浏览器控制台

**生产环境**：
- 后端日志：`backend.log`
- 前端日志：`frontend.log`

### 使用 PM2 监控

```cmd
pm2 logs smartstock-backend
pm2 logs smartstock-frontend
pm2 monit
```

## 备份和恢复

### 数据库备份

```cmd
mysqldump -u your_user -p smart_ware_system > backup.sql
```

### 数据库恢复

```cmd
mysql -u your_user -p smart_ware_system < backup.sql
```

## 技术支持

如遇到问题，请查看：
1. README.md - 项目说明
2. docs/CHANGELOG.md - 变更日志
3. GitHub Issues - 问题反馈

---

**SmartStock** - 让仓储管理更智能 🚀
