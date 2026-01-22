/**
 * SmartStock 设计规范常量
 * Design Tokens for Glass Morphism UI
 */

// 颜色系统
export const colors = {
  // 主色调
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#DBEAFE',
  
  // 背景色
  background: '#F8FAFC',
  backgroundGradient: 'linear-gradient(135deg, #EBF4FF 0%, #FFFFFF 100%)',
  
  // 卡片颜色 (玻璃拟态)
  card: 'rgba(255, 255, 255, 0.7)',
  cardBorder: 'rgba(255, 255, 255, 0.3)',
  cardShadow: 'rgba(148, 163, 184, 0.15)',
  
  // 文字颜色
  heading: '#334155',      // Slate-700
  body: '#64748B',         // Slate-500
  muted: '#94A3B8',        // Slate-400
  
  // 状态颜色
  success: {
    bg: '#ECFDF5',
    text: '#059669',
    border: '#10B981',
  },
  danger: {
    bg: '#FEF2F2',
    text: '#DC2626',
    border: '#EF4444',
  },
  warning: {
    bg: '#FFFBEB',
    text: '#D97706',
    border: '#F59E0B',
  },
  info: {
    bg: '#EFF6FF',
    text: '#2563EB',
    border: '#3B82F6',
  },
  
  // 边框颜色
  border: '#E2E8F0',       // Slate-200
  borderLight: '#F1F5F9',  // Slate-100
  
  // 表格颜色
  tableHeader: '#F8FAFC',
  tableRowHover: 'rgba(59, 130, 246, 0.05)',
  tableLowStock: 'rgba(239, 68, 68, 0.1)',
};

// 玻璃拟态效果
export const glassMorphism = {
  background: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderRadius: '16px',
  boxShadow: '0 4px 20px -5px rgba(148, 163, 184, 0.15)',
};

// 阴影系统
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  card: '0 4px 20px -5px rgba(148, 163, 184, 0.15)',
  button: '0 10px 15px -3px rgba(15, 23, 42, 0.2)',
};

// 圆角系统
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
};

// 间距系统
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
};

// 字体大小
export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
};

// 字体粗细
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// 动画过渡
export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
};

// 断点
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index 层级
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};
