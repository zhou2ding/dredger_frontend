import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          // 配置所有页面路径，使得所有页面都会被打包
          main: resolve(__dirname, 'src/renderer/index.html'),
          printRender:resolve(__dirname, 'src/renderer/fileRender/index.html'),
        }
      }
    }
  }
})
