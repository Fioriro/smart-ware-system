import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 公开路由（不需要认证）
const publicRoutes = ['/login', '/reset-password'];

// 静态资源路径
const staticPaths = ['/_next', '/favicon.ico', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // 从 cookie 或 header 获取 token
  const token = request.cookies.get('token')?.value;
  
  // 检查是否为公开路由
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  
  // 未登录用户访问受保护页面 -> 重定向到登录页
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // 已登录用户访问登录页 -> 重定向到仪表盘
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // 根路径重定向
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

// 配置匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
