'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';

// Button 变体类型
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

// Button 尺寸类型
type ButtonSize = 'sm' | 'md' | 'lg';

// Button Props
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// 变体样式映射
const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-blue-500 text-white 
    hover:bg-blue-600 
    focus:ring-blue-500/50
    shadow-md hover:shadow-lg
    disabled:bg-blue-300
  `,
  secondary: `
    bg-white text-slate-700 
    border border-slate-200
    hover:bg-slate-50 hover:border-slate-300
    focus:ring-slate-500/50
    disabled:bg-slate-100 disabled:text-slate-400
  `,
  danger: `
    bg-red-500 text-white 
    hover:bg-red-600 
    focus:ring-red-500/50
    shadow-md hover:shadow-lg
    disabled:bg-red-300
  `,
  ghost: `
    bg-transparent text-slate-600 
    hover:bg-slate-100 hover:text-slate-900
    focus:ring-slate-500/50
    disabled:text-slate-300
  `,
};

// 尺寸样式映射
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

// 加载动画组件
const LoadingSpinner = ({ size }: { size: ButtonSize }) => {
  const spinnerSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <svg
      className={`animate-spin ${spinnerSize[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Button 组件
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    const baseStyles = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-70
    `;
    
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${widthStyle}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        data-testid="button"
        {...props}
      >
        {loading ? (
          <LoadingSpinner size={size} />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
