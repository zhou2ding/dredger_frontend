import { createApp } from 'vue'
import printRender from '../src/views/exportFile/Index.vue'

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
//
//引入UI框架
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
//引入自定义指令

const app = createApp(printRender)
app.use(ElementPlus)
app.mount('#app')
