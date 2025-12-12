// src/supabaseClient.js - 修正后的安全版本

import { createClient } from '@supabase/supabase-js'

// 使用安全的配置获取方法
const getConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // 检查环境变量是否正确
  // 只检查是否存在，避免在控制台打印敏感密钥
  console.log('🔧 环境变量检查:', { envUrl: envUrl ? '已设置' : '未设置', envKey: envKey ? '已设置' : '未设置' })
  
  // 【重要修改】移除所有硬编码的默认值和 URL 链接
  // 如果环境变量未设置，则抛出错误，强制开发者在 .env.local 中配置
  
  if (!envUrl) {
    throw new Error('❌ VITE_SUPABASE_URL 未设置。请检查 .env.local 文件是否配置，以及 Vite 服务器是否已重启。')
  }
  
  if (!envKey) {
    throw new Error('❌ VITE_SUPABASE_ANON_KEY 未设置。请检查 .env.local 文件是否配置。')
  }
  
  // 如果检查通过，直接返回从 .env.local 加载的环境变量
  return { url: envUrl, key: envKey }
}

const config = getConfig()
console.log('✅ 使用的配置:', { 
  url: config.url, 
  keyLength: config.key?.length 
})

export const supabase = createClient(config.url, config.key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 开发环境调试
if (import.meta.env.DEV) {
  window.supabase = supabase
  console.log('🔧 Supabase客户端已初始化')
}