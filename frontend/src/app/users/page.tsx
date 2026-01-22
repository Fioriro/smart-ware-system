'use client';

import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Pagination, PaginationInfo } from '@/components/ui/Pagination';
import { SkeletonUserRow } from '@/components/ui/Skeleton';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { UserForm, CreateUserFormData, EditUserFormData } from '@/components/features/UserForm';
import { User, UserStatus, getUserStatusLabel, getUserRoleLabel } from '@/services/user.service';

// 图标组件
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// 用户管理页面
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    total,
    page,
    pageSize,
    totalPages,
    keyword,
    status,
    isLoading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    operationError,
    goToPage,
    searchKeyword,
    filterByStatus,
    refresh,
    resetFilters,
    clearOperationError,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
  } = useUsers();

  // 模态框状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 处理搜索关键词变化
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchKeyword(e.target.value);
  };

  // 处理状态筛选变化
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    filterByStatus(value === '' ? undefined : Number(value));
  };

  // 清除所有筛选
  const handleClearFilters = () => {
    resetFilters();
  };

  // 是否有筛选条件
  const hasFilters = keyword || status !== undefined;

  // 打开创建用户模态框
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  // 关闭创建用户模态框
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    clearOperationError();
  };

  // 打开编辑用户模态框
  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  // 关闭编辑用户模态框
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    clearOperationError();
  };

  // 打开删除确认模态框
  const handleOpenDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // 关闭删除确认模态框
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
    clearOperationError();
  };

  // 创建用户
  const handleCreateUser = useCallback(async (data: CreateUserFormData | EditUserFormData) => {
    const success = await createUser(data as CreateUserFormData);
    if (success) {
      handleCloseCreateModal();
    }
  }, [createUser]);

  // 更新用户
  const handleUpdateUser = useCallback(async (data: CreateUserFormData | EditUserFormData) => {
    if (!selectedUser) return;
    const success = await updateUser(selectedUser.id, data as EditUserFormData);
    if (success) {
      handleCloseEditModal();
    }
  }, [selectedUser, updateUser]);

  // 删除用户
  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    const success = await deleteUser(selectedUser.id);
    if (success) {
      handleCloseDeleteModal();
    }
  }, [selectedUser, deleteUser]);

  // 切换用户状态
  const handleToggleStatus = useCallback(async (user: User) => {
    await toggleStatus(user.id, user.status);
  }, [toggleStatus]);

  // 检查是否可以删除用户（不能删除当前登录用户）
  const canDeleteUser = (user: User): boolean => {
    return currentUser?.id !== user.id;
  };

  return (
    <Layout title="用户管理" subtitle="管理系统用户账户">
      {/* 操作错误提示 */}
      {operationError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
          <div>
            <p className="font-medium">操作失败</p>
            <p className="text-sm mt-1">{operationError}</p>
          </div>
          <button
            onClick={clearOperationError}
            className="text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 筛选区域 */}
      <Card className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="搜索用户名..."
              value={keyword}
              onChange={handleKeywordChange}
              leftIcon={<SearchIcon className="w-5 h-5" />}
              data-testid="filter-keyword"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={status ?? ''}
            onChange={handleStatusChange}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-sm text-slate-700 font-medium"
            data-testid="filter-status"
          >
            <option value="">全部状态</option>
            <option value={UserStatus.ENABLED}>启用</option>
            <option value={UserStatus.DISABLED}>禁用</option>
          </select>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                data-testid="clear-filters"
              >
                清除筛选
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              leftIcon={<RefreshIcon className="w-4 h-4" />}
              data-testid="refresh-users"
            >
              刷新
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<PlusIcon className="w-4 h-4" />}
              data-testid="create-user"
            >
              新建用户
            </Button>
          </div>
        </div>
      </Card>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
          <p className="font-medium">获取用户列表失败</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* 用户列表 */}
      <Card className="overflow-hidden">
        {isLoading ? (
          // 骨架屏加载状态
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <SkeletonUserRow />
                <SkeletonUserRow />
                <SkeletonUserRow />
                <SkeletonUserRow />
                <SkeletonUserRow />
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center">
            <UserIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400">暂无用户数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="users-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 transition-colors"
                    data-testid={`user-row-${user.id}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">
                          {user.username}
                          {currentUser?.id === user.id && (
                            <span className="ml-2 text-xs text-blue-500">(当前用户)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {getUserRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={isUpdating}
                        className={`
                          px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer
                          ${user.status === UserStatus.ENABLED
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        data-testid={`toggle-status-${user.id}`}
                      >
                        {getUserStatusLabel(user.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                          data-testid={`edit-user-${user.id}`}
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(user)}
                          disabled={!canDeleteUser(user)}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${canDeleteUser(user)
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-slate-200 cursor-not-allowed'
                            }
                          `}
                          title={canDeleteUser(user) ? '删除' : '不能删除当前登录用户'}
                          data-testid={`delete-user-${user.id}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 分页 */}
      {!isLoading && users.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <PaginationInfo
            currentPage={page}
            pageSize={pageSize}
            total={total}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* 创建用户模态框 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="新建用户"
        size="md"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={handleCloseCreateModal}
          isSubmitting={isCreating}
        />
      </Modal>

      {/* 编辑用户模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title={`编辑用户 - ${selectedUser?.username}`}
        size="md"
      >
        {selectedUser && (
          <UserForm
            initialData={{
              username: selectedUser.username,
              role: selectedUser.role,
              status: selectedUser.status,
            }}
            onSubmit={handleUpdateUser}
            onCancel={handleCloseEditModal}
            isEdit
            isSubmitting={isUpdating}
          />
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteUser}
        title="确认删除"
        message={`确定要删除用户 "${selectedUser?.username}" 吗？此操作不可恢复。`}
        confirmText="删除"
        cancelText="取消"
        variant="danger"
        loading={isDeleting}
      />
    </Layout>
  );
}
