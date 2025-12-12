import { ref, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Sizes } from '@/core/utils/Sizes'
import { getResources } from '@/composables/useResources'
import { getInteraction } from '@/composables/useInteraction'
import { getTransformControls } from '@/composables/useTransformControls'
import type { ExperienceConfig } from '@/types/three'

/**
 * Three.js Experience 的 Vue Composable
 * 注意：Three.js 对象使用 shallowRef 避免 Vue Proxy 与 Three.js 内部属性冲突
 */
export function useExperience() {
  // 资源管理器
  const resources = getResources()

  // 交互系统
  const interaction = getInteraction()

  // 变换控制器
  const transformControls = getTransformControls()

  // Three.js 核心对象（使用 shallowRef 避免深度代理）
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)
  const clock = shallowRef<THREE.Clock>(new THREE.Clock())
  const animationFrameId = ref<number | null>(null)

  // 管理器（使用 shallowRef 避免深度代理）
  const sizes = shallowRef<Sizes>(new Sizes())

  // 配置
  const config = ref<ExperienceConfig>({
    pixelRatio: Math.min(Math.max(window.devicePixelRatio || 1, 1), 2),
    width: window.innerWidth,
    height: window.innerHeight,
    debug: window.innerWidth > 420
  })

  // 加载状态（从 resources 获取）
  const isLoading = resources.isLoading
  const loadingProgress = resources.loadingProgress

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

    // 创建相机（调整为适合房间的视角）
    camera.value = new THREE.PerspectiveCamera(
      40,
      config.value.width / config.value.height,
      0.1,
      150
    )
    // 设置相机位置（俯视房间的角度）
    camera.value.position.set(5.5, 4, 5)

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })
    renderer.value.setSize(config.value.width, config.value.height)
    renderer.value.setPixelRatio(config.value.pixelRatio)
    renderer.value.outputColorSpace = THREE.SRGBColorSpace
    renderer.value.toneMapping = THREE.NoToneMapping

    // 添加到容器
    containerElement.appendChild(renderer.value.domElement)

    // 创建 OrbitControls
    controls.value = new OrbitControls(camera.value, renderer.value.domElement)
    controls.value.enableDamping = true
    controls.value.dampingFactor = 0.05
    controls.value.target.set(0, 1, 0)
    controls.value.minDistance = 3
    controls.value.maxDistance = 15
    controls.value.minPolarAngle = 0
    controls.value.maxPolarAngle = Math.PI / 2 + 0.1
    controls.value.update()

    // 初始化交互系统
    interaction.init(camera.value, renderer.value.domElement)

    // 初始化 TransformControls
    transformControls.init(
      camera.value,
      renderer.value.domElement,
      scene.value,
      controls.value
    )

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
  }

  /**
   * 动画循环
   */
  const animate = () => {
    // 更新控制器
    if (controls.value) {
      controls.value.update()
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

    // 清理交互系统
    interaction.destroy()

    // 清理 TransformControls
    transformControls.destroy()

    // 清理控制器
    if (controls.value) {
      controls.value.dispose()
    }

    // 清理渲染器
    if (renderer.value) {
      renderer.value.dispose()
      if (renderer.value.domElement.parentNode) {
        renderer.value.domElement.parentNode.removeChild(renderer.value.domElement)
      }
    }

    // 清理资源
    resources.destroy()
  }

  /**
   * 加载资源
   */
  const loadResources = async () => {
    await resources.loadAll()
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
    controls,

    // 管理器
    sizes,
    resources,
    interaction,
    transformControls,

    // 状态
    config,
    isLoading,
    loadingProgress,

    // 方法
    setContainer,
    loadResources,
    start,
    stop,
    destroy
  }
}
