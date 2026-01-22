'use client';

import React from 'react';
import { Navbar } from './Navbar';

// Layout Props
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

// Layout 组件
export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
      {/* 导航栏 */}
      <Navbar />
      
      {/* 主内容区域 */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 页面头部 */}
          {(title || actions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                )}
              </div>
              {actions && (
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
      
      {/* 页脚 */}
      <footer className="py-6 text-center text-sm text-slate-400">
        <p>© 2026 SmartStock 智能库存管理系统</p>
      </footer>
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
