import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // 直接硬编码值（仅用于测试，先让页面能打开）
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://zuplqpojcjwbmmjpacqx.supabase.co'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1cGxxcG9qY2p3Ym1tanBhY3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxOTc2NjEsImV4cCI6MjA4MDc3MzY2MX0.efrwhQ_DBBix8HRymgNwfkosi64R8OotOO1keL3oK5o')
  }
})