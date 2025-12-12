import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册 GSAP 插件
gsap.registerPlugin(MotionPathPlugin, ScrollTrigger)

/**
 * GSAP Vue 插件
 */
export default {
  install(app: any) {
    // 全局注入 gsap
    app.config.globalProperties.$gsap = gsap

    // 提供 composable
    app.provide('gsap', gsap)

    console.log('GSAP 插件已安装')
  }
}

// 导出 gsap 实例
export { gsap }
