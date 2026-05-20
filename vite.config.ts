import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 将 React 相关库分离
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // 将 Markdown 相关库分离
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark')) {
            return 'markdown-vendor';
          }
          // 将代码高亮库分离
          if (id.includes('node_modules/react-syntax-highlighter') || id.includes('node_modules/refractor')) {
            return 'syntax-highlighter';
          }
        }
      }
    }
  }
})