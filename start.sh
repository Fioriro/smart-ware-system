#!/bin/bash

# =============================================================================
# SmartStock 项目启动脚本
# =============================================================================
# 用途：一键启动前后端开发服务器
# 使用方法：./start.sh [dev|prod]
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查必要的命令
check_requirements() {
    print_info "检查系统要求..."
    
    if ! command_exists node; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    print_success "系统要求检查通过"
}

# 检查环境变量文件
check_env_files() {
    local mode=$1
    print_info "检查环境变量文件..."
    
    if [ "$mode" = "prod" ]; then
        if [ ! -f "backend/.env.production" ]; then
            print_error "backend/.env.production 文件不存在"
            exit 1
        fi
        if [ ! -f "frontend/.env.production" ]; then
            print_error "frontend/.env.production 文件不存在"
            exit 1
        fi
    else
        if [ ! -f "backend/.env.development" ]; then
            print_error "backend/.env.development 文件不存在"
            exit 1
        fi
        if [ ! -f "frontend/.env.development" ]; then
            print_error "frontend/.env.development 文件不存在"
            exit 1
        fi
    fi
    
    print_success "环境变量文件检查通过"
}

# 安装依赖
install_dependencies() {
    print_info "检查并安装依赖..."
    
    # 后端依赖
    if [ ! -d "backend/node_modules" ]; then
        print_info "安装后端依赖..."
        cd backend && npm install && cd ..
        print_success "后端依赖安装完成"
    else
        print_success "后端依赖已存在"
    fi
    
    # 前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        print_info "安装前端依赖..."
        cd frontend && npm install && cd ..
        print_success "前端依赖安装完成"
    else
        print_success "前端依赖已存在"
    fi
}

# 启动开发环境
start_dev() {
    print_info "启动开发环境..."
    
    # 生成 Prisma Client
    print_info "生成 Prisma Client..."
    cd backend && npm run prisma:generate && cd ..
    
    # 启动后端（后台运行）
    print_info "启动后端服务器 (http://localhost:3001)..."
    cd backend && npm run dev > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    # 启动前端（后台运行）
    print_info "启动前端服务器 (http://localhost:3000)..."
    cd frontend && npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 保存 PID
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
    
    print_success "开发环境启动成功！"
    echo ""
    print_info "后端地址: http://localhost:3001"
    print_info "前端地址: http://localhost:3000"
    print_info "后端日志: backend.log"
    print_info "前端日志: frontend.log"
    echo ""
    print_warning "按 Ctrl+C 停止服务器"
    
    # 等待用户中断
    trap cleanup INT
    wait
}

# 启动生产环境
start_prod() {
    print_info "启动生产环境..."
    
    # 构建后端
    print_info "构建后端..."
    cd backend && npm run build && cd ..
    print_success "后端构建完成"
    
    # 构建前端
    print_info "构建前端..."
    cd frontend && npm run build:prod && cd ..
    print_success "前端构建完成"
    
    # 启动后端（后台运行）
    print_info "启动后端服务器 (http://localhost:3001)..."
    cd backend && npm run start:prod > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    
    # 等待后端启动
    sleep 3
    
    # 启动前端（后台运行）
    print_info "启动前端服务器 (http://localhost:3000)..."
    cd frontend && npm run start:prod > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    
    # 保存 PID
    echo $BACKEND_PID > .backend.pid
    echo $FRONTEND_PID > .frontend.pid
    
    print_success "生产环境启动成功！"
    echo ""
    print_info "后端地址: http://localhost:3001"
    print_info "前端地址: http://localhost:3000"
    print_info "后端日志: backend.log"
    print_info "前端日志: frontend.log"
    echo ""
    print_warning "按 Ctrl+C 停止服务器"
    
    # 等待用户中断
    trap cleanup INT
    wait
}

# 清理函数
cleanup() {
    echo ""
    print_info "正在停止服务器..."
    
    if [ -f .backend.pid ]; then
        BACKEND_PID=$(cat .backend.pid)
        kill $BACKEND_PID 2>/dev/null || true
        rm .backend.pid
        print_success "后端服务器已停止"
    fi
    
    if [ -f .frontend.pid ]; then
        FRONTEND_PID=$(cat .frontend.pid)
        kill $FRONTEND_PID 2>/dev/null || true
        rm .frontend.pid
        print_success "前端服务器已停止"
    fi
    
    exit 0
}

# 主函数
main() {
    echo ""
    echo "╔═══════════════════════════════════════╗"
    echo "║     SmartStock 项目启动脚本          ║"
    echo "╚═══════════════════════════════════════╝"
    echo ""
    
    MODE=${1:-dev}
    
    if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
        print_error "无效的模式: $MODE"
        echo "使用方法: ./start.sh [dev|prod]"
        exit 1
    fi
    
    check_requirements
    check_env_files $MODE
    install_dependencies
    
    if [ "$MODE" = "prod" ]; then
        start_prod
    else
        start_dev
    fi
}

# 运行主函数
main "$@"
