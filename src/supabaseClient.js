// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// 使用安全的配置获取方法
const getConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  // 检查环境变量是否正确
  console.log('🔧 环境变量检查:', { envUrl, envKey })
  
  if (!envUrl || envUrl === '链接') {
    console.warn('⚠️ 环境变量VITE_SUPABASE_URL未正确设置，使用默认值')
    return {
      url: 'https://umqmouebfogpsdcchiqk.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtcW1vdWViZm9ncHNkY2NoaXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQwNzIsImV4cCI6MjA4MDQxMDA3Mn0.5qsLQusjbP6sG3fweJUCYpz01IZsdxP3uNEETwytT-s'
    }
  }
  
  if (!envKey) {
    throw new Error('❌ 请检查.env.local文件中的VITE_SUPABASE_ANON_KEY配置')
  }
  
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