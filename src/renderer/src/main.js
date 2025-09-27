import './style/base.less'
import router from './router/index'
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// ✅ 仅在 Electron 渲染进程里才触发，避免浏览器环境报错
if (typeof window !== 'undefined' && window.process && window.process.versions?.electron) {
  window.process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
