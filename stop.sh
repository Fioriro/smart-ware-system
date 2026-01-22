#!/bin/bash

# =============================================================================
# SmartStock 项目停止脚本
# =============================================================================
# 用途：停止正在运行的前后端服务器
# 使用方法：./stop.sh
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

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║     SmartStock 项目停止脚本          ║"
echo "╚═══════════════════════════════════════╝"
echo ""

print_info "正在停止服务器..."

# 停止后端
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        print_success "后端服务器已停止 (PID: $BACKEND_PID)"
    else
        print_warning "后端服务器进程不存在"
    fi
    rm .backend.pid
else
    print_warning "未找到后端 PID 文件"
fi

# 停止前端
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        print_success "前端服务器已停止 (PID: $FRONTEND_PID)"
    else
        print_warning "前端服务器进程不存在"
    fi
    rm .frontend.pid
else
    print_warning "未找到前端 PID 文件"
fi

# 尝试通过端口查找并停止进程
print_info "检查端口占用..."

# 停止占用 3001 端口的进程（后端）
BACKEND_PORT_PID=$(lsof -ti:3001 2>/dev/null || true)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    kill $BACKEND_PORT_PID 2>/dev/null || true
    print_success "已停止占用端口 3001 的进程"
fi

# 停止占用 3000 端口的进程（前端）
FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null || true)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    kill $FRONTEND_PORT_PID 2>/dev/null || true
    print_success "已停止占用端口 3000 的进程"
fi

echo ""
print_success "所有服务器已停止"
echo ""
