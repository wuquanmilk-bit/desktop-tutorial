import { createClient } from '@supabase/supabase-js'

/**
 * @function getConfig
 * @description 健壮地从 Vite 环境变量中获取 Supabase 的 URL 和匿名 Key。
 * @returns {{url: string, key: string}} 包含 URL 和 Key 的对象
 * @throws {Error} 如果任何必需的环境变量缺失，则抛出错误。
 */
const getConfig = () => {
  // 注意：Vite 要求客户端侧的环境变量必须以 VITE_ 开头
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // 关键检查：确保 URL 和 Key 都存在
  if (!envUrl) {
    throw new Error(
      '❌ 缺少 VITE_SUPABASE_URL。请检查 .env.local 或部署配置。'
    )
  }
  if (!envKey) {
    throw new Error(
      '❌ 缺少 VITE_SUPABASE_ANON_KEY。请检查 .env.local 或部署配置。'
    )
  }
  
  // 打印调试信息（Key 只显示长度以确保安全）
  console.log('🔧 环境变量检查:', { 
    envUrl: envUrl.substring(0, 30) + '...', // 截断 URL 保护隐私
    envKeyLength: envKey.length 
  })
  
  return { url: envUrl, key: envKey }
}

// 1. 获取配置
const config = getConfig()

// 2. 创建 Supabase 客户端
export const supabase = createClient(config.url, config.key, {
  // Supabase 客户端配置
  auth: {
    // 启用 Session 自动持久化（通常使用 localStorage/IndexedDB）
    persistSession: true, 
    // 启用自动刷新 Token
    autoRefreshToken: true,
    // 检测 URL 中的 Session（例如从 Magic Link 邮件重定向回来时）
    detectSessionInUrl: true 
  },
  // 您可以在这里添加其他配置，例如 schema: 'public'
})

// 3. 开发环境调试
if (import.meta.env.DEV) {
  // 方便在浏览器控制台直接调试
  window.supabase = supabase 
  console.log('✅ Supabase客户端已初始化并可在 window.supabase 访问')
}