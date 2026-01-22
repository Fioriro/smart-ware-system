'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useDashboard } from '@/hooks/useDashboard';
import { useAlertStore, useAuthStore } from '@/stores';

// 图标组件
const PackageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MinusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
  </svg>
);

const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// 统计卡片骨架屏
const StatCardSkeleton = () => (
  <Card className="p-8">
    <div className="flex items-center justify-between animate-pulse">
      <div>
        <div className="h-4 w-20 bg-slate-200 rounded mb-3" />
        <div className="h-10 w-24 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-16 bg-slate-100 rounded" />
      </div>
      <div className="w-14 h-14 bg-slate-100 rounded-xl" />
    </div>
  </Card>
);

// 统计卡片组件
interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
  titleColor?: string;
  onClick?: () => void;
  highlight?: boolean;
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor,
  valueColor = 'text-slate-700',
  titleColor = 'text-slate-500',
  onClick,
  highlight = false,
}) => (
  <Card
    className={`p-8 transition-all hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${highlight ? 'border-l-4 border-l-rose-300' : ''}`}
    onClick={onClick}
    hover
    data-testid="stat-card"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm font-medium ${titleColor}`}>{title}</p>
        <h2 className={`text-4xl font-bold mt-2 ${valueColor}`}>{value}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-2">{subtitle}</p>}
      </div>
      <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center`}>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
  </Card>
);

// 低库存预警提示框
interface LowStockAlertBannerProps {
  count: number;
  onViewDetails: () => void;
  onDismiss: () => void;
}

const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  count,
  onViewDetails,
  onDismiss,
}) => (
  <Card className="p-6 border-l-4 border-l-rose-300 bg-rose-50/50" data-testid="low-stock-banner">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertIcon className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <p className="font-semibold text-slate-700">库存预警提醒</p>
          <p className="text-slate-500 text-sm">
            有 <span className="text-rose-500 font-semibold">{count}</span> 个商品库存低于预警阈值，请及时补货
          </p>
        </div>
      </div>
      <div className="flex gap-3 w-full sm:w-auto">
        <Button variant="primary" onClick={onViewDetails} className="flex-1 sm:flex-none">
          查看详情
        </Button>
        <Button variant="secondary" onClick={onDismiss} className="flex-1 sm:flex-none">
          稍后提醒
        </Button>
      </div>
    </div>
  </Card>
);

// 低库存预警弹窗
interface LowStockAlertModalProps {
  isOpen: boolean;
  count: number;
  onViewDetails: () => void;
  onDismiss: () => void;
}

const LowStockAlertModal: React.FC<LowStockAlertModalProps> = ({
  isOpen,
  count,
  onViewDetails,
  onDismiss,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onDismiss}
    size="sm"
    showCloseButton={false}
    closeOnOverlay={false}
  >
    <div className="text-center" data-testid="low-stock-modal">
      <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
        <AlertIcon className="w-8 h-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">库存预警</h3>
      <p className="text-slate-600 mb-6">
        当前有 <span className="text-rose-500 font-bold text-lg">{count}</span> 个商品库存低于预警阈值，建议及时补货以避免缺货。
      </p>
      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onDismiss}>
          稍后提醒
        </Button>
        <Button variant="primary" onClick={onViewDetails}>
          查看详情
        </Button>
      </div>
    </div>
  </Modal>
);

// 仪表盘页面
export default function DashboardPage() {
  const router = useRouter();
  const { stats, isLoading, isRefreshing, error, refresh } = useDashboard();
  const { user } = useAuthStore();
  const { showAlert, setShowAlert, setLowStockCount, dismissAlert } = useAlertStore();
  
  // 首次加载时检查低库存预警
  const [hasCheckedAlert, setHasCheckedAlert] = useState(false);
  
  useEffect(() => {
    if (stats && !hasCheckedAlert) {
      setLowStockCount(stats.lowStockCount);
      if (stats.lowStockCount > 0) {
        // 检查是否已经dismiss过（本次会话）
        const dismissed = sessionStorage.getItem('lowStockAlertDismissed');
        if (!dismissed) {
          setShowAlert(true);
        }
      }
      setHasCheckedAlert(true);
    }
  }, [stats, hasCheckedAlert, setLowStockCount, setShowAlert]);

  // 查看低库存详情
  const handleViewLowStock = () => {
    dismissAlert();
    router.push('/products?lowStock=true');
  };

  // 关闭预警弹窗
  const handleDismissAlert = () => {
    dismissAlert();
    sessionStorage.setItem('lowStockAlertDismissed', 'true');
  };

  // 格式化数字
  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN');
  };

  return (
    <Layout
      title="仪表盘"
      subtitle={`欢迎回来，${user?.username || '管理员'}`}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600" data-testid="error-message">
          <p className="font-medium">获取数据失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 统计卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* 商品总数 */}
            <DashboardStatCard
              title="商品总数"
              value={formatNumber(stats?.totalProducts || 0)}
              icon={<PackageIcon className="w-7 h-7" />}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-500"
            />

            {/* 库存总量 */}
            <DashboardStatCard
              title="库存总量"
              value={formatNumber(stats?.totalQuantity || 0)}
              icon={<ChartIcon className="w-7 h-7" />}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-500"
            />

            {/* 低库存预警 */}
            <DashboardStatCard
              title="低库存预警"
              value={stats?.lowStockCount || 0}
              subtitle="点击查看 →"
              icon={<AlertIcon className="w-7 h-7" />}
              iconBgColor="bg-rose-50"
              iconColor="text-rose-300"
              titleColor="text-rose-400"
              onClick={handleViewLowStock}
              highlight={true}
            />

            {/* 今日入库 */}
            <DashboardStatCard
              title="今日入库"
              value={`+${formatNumber(stats?.todayInbound || 0)}`}
              icon={<PlusIcon className="w-7 h-7" />}
              iconBgColor="bg-slate-100"
              iconColor="text-slate-500"
              valueColor="text-emerald-600"
            />
          </>
        )}
      </div>

      {/* 第二行统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          <StatCardSkeleton />
        ) : (
          /* 今日出库 */
          <DashboardStatCard
            title="今日出库"
            value={`-${formatNumber(stats?.todayOutbound || 0)}`}
            icon={<MinusIcon className="w-7 h-7" />}
            iconBgColor="bg-slate-100"
            iconColor="text-slate-500"
            valueColor="text-rose-400"
          />
        )}
      </div>

      {/* 低库存预警提示框（当有低库存商品时显示） */}
      {!isLoading && stats && stats.lowStockCount > 0 && (
        <LowStockAlertBanner
          count={stats.lowStockCount}
          onViewDetails={handleViewLowStock}
          onDismiss={handleDismissAlert}
        />
      )}

      {/* 低库存预警弹窗 */}
      <LowStockAlertModal
        isOpen={showAlert}
        count={stats?.lowStockCount || 0}
        onViewDetails={handleViewLowStock}
        onDismiss={handleDismissAlert}
      />
    </Layout>
  );
}
