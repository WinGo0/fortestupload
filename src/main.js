import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
// import 'luckysheet/dist/plugins/css/pluginsCss.css'
// import 'luckysheet/dist/plugins/plugins.css'
// import 'luckysheet/dist/css/luckysheet.css'
// import 'luckysheet/dist/assets/iconfont/iconfont.css'
// import 'luckysheet/dist/plugins/js/plugin.js'
// import Luckysheet from 'luckysheet'
import './style.css'
import App from './App.vue'

// window.luckysheet = window.luckysheet || Luckysheet

const app = createApp(App)
app.use(ElementPlus)
app.use(Antd)
app.mount('#app')
