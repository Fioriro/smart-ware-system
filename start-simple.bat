@echo off
REM =============================================================================
REM SmartStock 简化启动脚本 (Windows)
REM =============================================================================
REM 用途：快速启动开发环境
REM 使用方法：双击运行或在命令行执行 start-simple.bat
REM =============================================================================

echo.
echo ========================================
echo   SmartStock 快速启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [1/4] 检查环境...
if not exist "backend\.env.development" (
    echo [错误] backend\.env.development 文件不存在
    echo 请先配置环境变量文件
    pause
    exit /b 1
)

echo [2/4] 生成 Prisma Client...
cd backend
call npm run prisma:generate >nul 2>&1
cd ..

echo [3/4] 启动后端服务器...
start "SmartStock Backend" cmd /k "cd /d %CD%\backend && npm run dev"

echo [4/4] 启动前端服务器...
timeout /t 3 /nobreak >nul
start "SmartStock Frontend" cmd /k "cd /d %CD%\frontend && npm run dev"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo.
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo.
echo 默认账号: admin / admin123
echo.
echo 关闭命令行窗口即可停止服务
echo.
pause
