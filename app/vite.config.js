import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径, 使构建产物可通过 file:// 直接打开或部署到任意子目录
  base: './',
  plugins: [vue()],
})
