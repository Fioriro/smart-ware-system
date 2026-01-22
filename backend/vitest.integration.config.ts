/**
 * Vitest 集成测试配置
 * 专门用于运行集成测试，具有更长的超时时间和串行执行
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 只包含集成测试
    include: ['src/tests/integration/**/*.test.ts'],
    exclude: ['node_modules/**'],
    // 集成测试需要更长的超时时间
    testTimeout: 30000,
    // 钩子超时时间（增加到60秒以处理数据库清理）
    hookTimeout: 60000,
    // 串行执行集成测试，避免数据库冲突
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // 测试隔离
    isolate: true,
    // 测试文件按顺序执行
    sequence: {
      shuffle: false,
    },
    // 设置测试环境变量
    env: {
      NODE_ENV: 'test',
    },
    // 全局设置
    globalSetup: ['src/tests/integration/globalSetup.ts'],
    // 测试报告
    reporters: ['verbose'],
    // 失败时不立即退出，继续运行其他测试
    bail: 0,
    // 设置根目录
    root: '.',
  },
});
