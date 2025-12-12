// vite.config.js - 修正后的版本
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 【重要】删除 define 块，让 Vite 自动加载 .env.local
  // define: {
  //   'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('...'),
  //   'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('...')
  // }
})