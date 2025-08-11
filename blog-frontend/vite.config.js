import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    open: true,
    host: '0.0.0.0',
    port: 3000,
    // Docker 环境下的热重载配置
    watch: {
      usePolling: true
    }
  },
  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 优化构建性能
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue']
        }
      }
    }
  },
  // 预览服务器配置（用于生产构建预览）
  preview: {
    host: '0.0.0.0',
    port: 4173
  }
})