/**
 * Zustand 状态管理
 * 全局状态存储
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户信息类型
export interface User {
  id: number;
  username: string;
  role: string;
}

// 认证状态类型
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

// 认证状态存储
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token: string, user: User) => {
        // 同时存储到 localStorage（用于 API 请求）
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
      
      clearAuth: () => {
        // 清除 localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// UI 状态类型
interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// UI 状态存储
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));

// 低库存预警状态类型
interface AlertState {
  lowStockCount: number;
  showAlert: boolean;
  setLowStockCount: (count: number) => void;
  setShowAlert: (show: boolean) => void;
  dismissAlert: () => void;
}

// 低库存预警状态存储
export const useAlertStore = create<AlertState>((set) => ({
  lowStockCount: 0,
  showAlert: false,
  
  setLowStockCount: (count: number) => set({ lowStockCount: count }),
  
  setShowAlert: (show: boolean) => set({ showAlert: show }),
  
  dismissAlert: () => set({ showAlert: false }),
}));
