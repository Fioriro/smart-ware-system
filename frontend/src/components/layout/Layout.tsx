'use client';

import React from 'react';
import { Navbar } from './Navbar';

// Layout Props
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';
  centered?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

// Layout 组件
export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  maxWidth = '6xl',
  centered = false,
}) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 导航栏 */}
      <Navbar />
      
      {/* 主内容区域 - 桌面端 pt-28 为浮动导航留空间，移动端 pt-20 */}
      <main className="pt-20 md:pt-28 pb-12 px-4">
        <div className={`${maxWidthClasses[maxWidth]} mx-auto`}>
          {/* 页面头部 */}
          {(title || actions) && (
            <div className={`mb-8 ${centered ? 'text-center' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
              <div>
                {title && (
                  <h1 className="text-3xl font-bold text-slate-700">{title}</h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-slate-500">{subtitle}</p>
                )}
              </div>
              {actions && !centered && (
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          )}
          
          {/* 页面内容 */}
          {children}
        </div>
      </main>
    </div>
  );
};

// 页面容器组件
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {children}
    </div>
  );
};

// 页面区块组件
interface PageSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageSection: React.FC<PageSectionProps> = ({
  children,
  title,
  description,
  actions,
  className = '',
}) => {
  return (
    <section className={className}>
      {(title || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export default Layout;
