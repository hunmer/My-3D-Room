import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import gsapPlugin from './plugins/gsap'

const app = createApp(App)

// 使用 GSAP 插件
app.use(gsapPlugin)

app.mount('#app')
