/**
 * 集成测试全局设置
 * 在所有集成测试运行前执行
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 加载测试环境变量
dotenv.config({ path: '.env.development' });

export async function setup(): Promise<void> {
  console.log('\n🔧 正在设置集成测试环境...');

  const prisma = new PrismaClient();

  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 验证数据库表结构
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `;
    console.log(`✅ 数据库表数量: ${tables.length}`);

  } catch (error) {
    console.error('❌ 集成测试环境设置失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log('✅ 集成测试环境设置完成\n');
}

export async function teardown(): Promise<void> {
  console.log('\n🧹 正在清理集成测试环境...');
  console.log('✅ 集成测试环境清理完成\n');
}
