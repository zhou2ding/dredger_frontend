import './style/base.less'
import router from "./router/index";

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
import { createPinia } from 'pinia'

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.mount('#app')
