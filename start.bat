@echo off
REM =============================================================================
REM SmartStock 项目启动脚本 (Windows)
REM =============================================================================
REM 用途：一键启动前后端开发服务器
REM 使用方法：start.bat [dev|prod]
REM =============================================================================

setlocal enabledelayedexpansion

REM 设置默认模式
set MODE=%1
if "%MODE%"=="" set MODE=dev

REM 检查模式是否有效
if not "%MODE%"=="dev" if not "%MODE%"=="prod" (
    echo [错误] 无效的模式: %MODE%
    echo 使用方法: start.bat [dev^|prod]
    exit /b 1
)

echo.
echo ╔═══════════════════════════════════════╗
echo ║     SmartStock 项目启动脚本          ║
echo ╚═══════════════════════════════════════╝
echo.

REM 检查 Node.js
echo [信息] 检查系统要求...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装，请先安装 Node.js
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] npm 未安装，请先安装 npm
    exit /b 1
)
echo [成功] 系统要求检查通过
echo.

REM 检查环境变量文件
echo [信息] 检查环境变量文件...
if "%MODE%"=="prod" (
    if not exist "backend\.env.production" (
        echo [错误] backend\.env.production 文件不存在
        exit /b 1
    )
    if not exist "frontend\.env.production" (
        echo [错误] frontend\.env.production 文件不存在
        exit /b 1
    )
) else (
    if not exist "backend\.env.development" (
        echo [错误] backend\.env.development 文件不存在
        exit /b 1
    )
    if not exist "frontend\.env.development" (
        echo [错误] frontend\.env.development 文件不存在
        exit /b 1
    )
)
echo [成功] 环境变量文件检查通过
echo.

REM 安装依赖
echo [信息] 检查并安装依赖...

if not exist "backend\node_modules" (
    echo [信息] 安装后端依赖...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 后端依赖安装失败
        exit /b 1
    )
    cd ..
    echo [成功] 后端依赖安装完成
) else (
    echo [成功] 后端依赖已存在
)

if not exist "frontend\node_modules" (
    echo [信息] 安装前端依赖...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 前端依赖安装失败
        exit /b 1
    )
    cd ..
    echo [成功] 前端依赖安装完成
) else (
    echo [成功] 前端依赖已存在
)
echo.

REM 生成 Prisma Client
echo [信息] 生成 Prisma Client...
cd backend
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo [错误] Prisma Client 生成失败
    exit /b 1
)
cd ..
echo.

if "%MODE%"=="prod" goto PROD_MODE
goto DEV_MODE

:PROD_MODE
REM 生产环境
echo [信息] 启动生产环境...
echo.

REM 构建后端
echo [信息] 构建后端...
cd backend
call npm run build
if errorlevel 1 (
    echo [错误] 后端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo [成功] 后端构建完成
echo.

REM 构建前端
echo [信息] 构建前端...
cd frontend
call npm run build:prod
if errorlevel 1 (
    echo [错误] 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo [成功] 前端构建完成
echo.

REM 启动后端
echo [信息] 启动后端服务器 (http://localhost:3001)...
start "SmartStock Backend" cmd /k "cd /d %CD%\backend && npm run start:prod"
timeout /t 3 /nobreak >nul

REM 启动前端
echo [信息] 启动前端服务器 (http://localhost:3000)...
start "SmartStock Frontend" cmd /k "cd /d %CD%\frontend && npm run start:prod"
goto END

:DEV_MODE
REM 开发环境
echo [信息] 启动开发环境...
echo.

REM 启动后端
echo [信息] 启动后端服务器 (http://localhost:3001)...
start "SmartStock Backend" cmd /k "cd /d %CD%\backend && npm run dev"
timeout /t 3 /nobreak >nul

REM 启动前端
echo [信息] 启动前端服务器 (http://localhost:3000)...
start "SmartStock Frontend" cmd /k "cd /d %CD%\frontend && npm run dev"
goto END

:END

echo.
echo [成功] 服务器启动成功！
echo.
echo [信息] 后端地址: http://localhost:3001
echo [信息] 前端地址: http://localhost:3000
echo.
echo [提示] 关闭命令行窗口即可停止服务器
echo.

pause
