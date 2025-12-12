import { ref, shallowRef } from 'vue'
import * as THREE from 'three'
import { Time } from '@/core/utils/Time'
import { Sizes } from '@/core/utils/Sizes'
import { Loader } from '@/core/utils/Loader'
import type { ExperienceConfig } from '@/types/three'

/**
 * Three.js Experience 的 Vue Composable
 * 注意：Three.js 对象使用 shallowRef 避免 Vue Proxy 与 Three.js 内部属性冲突
 */
export function useExperience() {
  // Three.js 核心对象（使用 shallowRef 避免深度代理）
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const clock = shallowRef<THREE.Clock>(new THREE.Clock())
  const animationFrameId = ref<number | null>(null)

  // 管理器（使用 shallowRef 避免深度代理）
  const time = shallowRef<Time>(new Time())
  const sizes = shallowRef<Sizes>(new Sizes())
  const loader = shallowRef<Loader>(new Loader())

  // 配置
  const config = ref<ExperienceConfig>({
    pixelRatio: Math.min(Math.max(window.devicePixelRatio || 1, 1), 2),
    width: window.innerWidth,
    height: window.innerHeight,
    debug: window.innerWidth > 420
  })

  // 加载状态
  const isLoading = ref(true)
  const loadingProgress = ref(0)

  // 容器
  const container = ref<HTMLElement | null>(null)

  /**
   * 初始化 Three.js
   */
  const initThree = (containerElement: HTMLElement) => {
    container.value = containerElement

    // 创建场景
    scene.value = new THREE.Scene()
    scene.value.background = new THREE.Color('#010101')

    // 创建相机
    camera.value = new THREE.PerspectiveCamera(
      20,
      config.value.width / config.value.height,
      0.1,
      150
    )
    camera.value.position.set(0, 1.5, 5)

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })
    renderer.value.setSize(config.value.width, config.value.height)
    renderer.value.setPixelRatio(config.value.pixelRatio)

    // 设置调试模式
    if (config.value.debug) {
      renderer.value.shadowMap.enabled = true
      renderer.value.shadowMap.type = THREE.PCFSoftShadowMap
    }

    // 添加到容器
    containerElement.appendChild(renderer.value.domElement)

    // 设置监听器
    setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    // 窗口尺寸变化
    sizes.value.onResizeEvent(({ width, height, pixelRatio }) => {
      config.value.width = width
      config.value.height = height
      config.value.pixelRatio = pixelRatio

      if (camera.value) {
        camera.value.aspect = width / height
        camera.value.updateProjectionMatrix()
      }

      if (renderer.value) {
        renderer.value.setSize(width, height)
        renderer.value.setPixelRatio(pixelRatio)
      }
    })

    // 资源加载进度
    loader.value.onProgress(({ loaded, total }) => {
      loadingProgress.value = (loaded / total) * 100
      if (loaded === total) {
        isLoading.value = false
      }
    })
  }

  /**
   * 动画循环
   */
  const animate = () => {
    clock.value.getDelta() // 获取delta time但不存储

    // 更新相机
    if (camera.value) {
      camera.value.updateProjectionMatrix()
    }

    // 渲染场景
    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }

    animationFrameId.value = requestAnimationFrame(animate)
  }

  /**
   * 启动动画
   */
  const start = () => {
    animate()
  }

  /**
   * 停止动画
   */
  const stop = () => {
    if (animationFrameId.value !== null) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = null
    }
  }

  /**
   * 销毁 Three.js 实例
   */
  const destroy = () => {
    stop()

    // 清理监听器
    sizes.value.destroy()

    // 清理渲染器
    if (renderer.value) {
      renderer.value.dispose()
      if (renderer.value.domElement.parentNode) {
        renderer.value.domElement.parentNode.removeChild(renderer.value.domElement)
      }
    }

    // 清理加载器
    loader.value.destroy()
  }

  /**
   * 添加对象到场景
   */
  const addToScene = (object: THREE.Object3D) => {
    if (scene.value) {
      scene.value.add(object)
    }
  }

  /**
   * 从场景移除对象
   */
  const removeFromScene = (object: THREE.Object3D) => {
    if (scene.value) {
      scene.value.remove(object)
    }
  }

  /**
   * 设置容器并初始化
   */
  const setContainer = (containerElement: HTMLElement) => {
    initThree(containerElement)
  }

  return {
    // 核心对象
    scene,
    camera,
    renderer,

    // 管理器
    time,
    sizes,
    loader,

    // 状态
    config,
    isLoading,
    loadingProgress,

    // 方法
    setContainer,
    start,
    stop,
    destroy,
    addToScene,
    removeFromScene
  }
}
