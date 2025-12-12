import { ref, shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'
import { gsap } from '@/core/utils/Animation'

/**
 * 可交互对象配置
 */
export interface InteractiveConfig {
  /** 对象名称（用于调试） */
  name?: string
  /** 点击回调 */
  onClick?: (object: THREE.Object3D, event: MouseEvent) => void
  /** 是否启用弹跳动画（默认 true） */
  bounceEnabled?: boolean
  /** 弹跳缩放比例（默认 1.15） */
  bounceScale?: number
  /** 弹跳动画时长（秒，默认 0.15） */
  bounceDuration?: number
  /** 弹跳动画曲线（默认 'back.out(3)'） */
  bounceEase?: string
}

/**
 * 已注册的可交互对象
 */
interface RegisteredObject {
  object: THREE.Object3D
  config: Required<InteractiveConfig>
  originalScale: THREE.Vector3
  isAnimating: boolean
}

// 全局单例状态（确保跨组件共享）
const registeredObjects = new Map<THREE.Object3D, RegisteredObject>()
const isInitialized = ref(false)

// Three.js 对象（使用普通变量避免响应式问题）
let raycaster: THREE.Raycaster | null = null
let mouse: THREE.Vector2 | null = null
let camera: THREE.Camera | null = null
let domElement: HTMLElement | null = null

// 事件处理函数引用
let clickHandler: ((event: MouseEvent) => void) | null = null
let hoverHandler: ((event: MouseEvent) => void) | null = null

/**
 * 3D 对象交互系统
 * 提供射线检测、点击事件和弹跳动画
 */
export function useInteraction() {
  /**
   * 初始化交互系统
   */
  const init = (
    cameraInstance: THREE.Camera,
    rendererDomElement: HTMLElement
  ) => {
    if (isInitialized.value) return

    camera = cameraInstance
    domElement = rendererDomElement

    // 初始化射线检测器
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()

    // 绑定事件
    clickHandler = handleClick
    hoverHandler = handleHover

    domElement.addEventListener('click', clickHandler)
    domElement.addEventListener('pointermove', hoverHandler)

    isInitialized.value = true
  }

  /**
   * 注册可交互对象
   * @param object Three.js 对象或对象组
   * @param config 交互配置
   */
  const register = (
    object: THREE.Object3D,
    config: InteractiveConfig = {}
  ) => {
    // 合并默认配置
    const fullConfig: Required<InteractiveConfig> = {
      name: config.name ?? object.name ?? 'unnamed',
      onClick: config.onClick ?? (() => {}),
      bounceEnabled: config.bounceEnabled ?? true,
      bounceScale: config.bounceScale ?? 1.15,
      bounceDuration: config.bounceDuration ?? 0.15,
      bounceEase: config.bounceEase ?? 'back.out(3)'
    }

    // 保存原始缩放
    const originalScale = object.scale.clone()

    registeredObjects.set(object, {
      object,
      config: fullConfig,
      originalScale,
      isAnimating: false
    })

    return () => unregister(object)
  }

  /**
   * 批量注册对象组中的所有 Mesh
   * @param group 对象组
   * @param config 统一配置
   */
  const registerGroup = (
    group: THREE.Object3D,
    config: InteractiveConfig = {}
  ) => {
    const unregisterFns: Array<() => void> = []

    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        unregisterFns.push(register(child, {
          ...config,
          name: config.name ?? child.name
        }))
      }
    })

    return () => unregisterFns.forEach(fn => fn())
  }

  /**
   * 注销可交互对象
   */
  const unregister = (object: THREE.Object3D) => {
    const registered = registeredObjects.get(object)
    if (registered) {
      // 恢复原始缩放
      object.scale.copy(registered.originalScale)
      // 停止任何进行中的动画
      gsap.killTweensOf(object.scale)
      registeredObjects.delete(object)
    }
  }

  /**
   * 处理点击事件
   */
  const handleClick = (event: MouseEvent) => {
    if (!raycaster || !mouse || !camera || !domElement) return

    // 计算归一化设备坐标
    const rect = domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    // 更新射线
    raycaster.setFromCamera(mouse, camera)

    // 获取所有注册对象
    const objects = Array.from(registeredObjects.keys())
    if (objects.length === 0) return

    // 检测相交
    const intersects = raycaster.intersectObjects(objects, true)

    if (intersects.length > 0) {
      // 找到被点击的注册对象
      const clickedMesh = intersects[0].object
      const registered = findRegisteredParent(clickedMesh)

      if (registered && !registered.isAnimating) {
        // 执行弹跳动画
        if (registered.config.bounceEnabled) {
          playBounceAnimation(registered)
        }

        // 触发回调
        registered.config.onClick(registered.object, event)
      }
    }
  }

  /**
   * 处理悬停事件（更改光标）
   */
  const handleHover = (event: MouseEvent) => {
    if (!raycaster || !mouse || !camera || !domElement) return

    const rect = domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    raycaster.setFromCamera(mouse, camera)

    const objects = Array.from(registeredObjects.keys())
    if (objects.length === 0) {
      domElement.style.cursor = 'default'
      return
    }

    const intersects = raycaster.intersectObjects(objects, true)
    domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default'
  }

  /**
   * 查找已注册的父对象
   */
  const findRegisteredParent = (
    object: THREE.Object3D
  ): RegisteredObject | null => {
    let current: THREE.Object3D | null = object

    while (current) {
      const registered = registeredObjects.get(current)
      if (registered) return registered
      current = current.parent
    }

    return null
  }

  /**
   * 播放弹跳动画
   */
  const playBounceAnimation = (registered: RegisteredObject) => {
    const { object, config, originalScale } = registered

    registered.isAnimating = true

    // 弹跳放大
    gsap.to(object.scale, {
      x: originalScale.x * config.bounceScale,
      y: originalScale.y * config.bounceScale,
      z: originalScale.z * config.bounceScale,
      duration: config.bounceDuration,
      ease: config.bounceEase,
      onComplete: () => {
        // 弹回原始大小
        gsap.to(object.scale, {
          x: originalScale.x,
          y: originalScale.y,
          z: originalScale.z,
          duration: config.bounceDuration,
          ease: 'power2.out',
          onComplete: () => {
            registered.isAnimating = false
          }
        })
      }
    })
  }

  /**
   * 销毁交互系统
   */
  const destroy = () => {
    if (domElement && clickHandler) {
      domElement.removeEventListener('click', clickHandler)
    }
    if (domElement && hoverHandler) {
      domElement.removeEventListener('pointermove', hoverHandler)
    }

    // 清理所有注册的对象
    registeredObjects.forEach((registered) => {
      gsap.killTweensOf(registered.object.scale)
    })
    registeredObjects.clear()

    raycaster = null
    mouse = null
    camera = null
    domElement = null
    clickHandler = null
    hoverHandler = null
    isInitialized.value = false
  }

  return {
    init,
    register,
    registerGroup,
    unregister,
    destroy,
    isInitialized
  }
}

/**
 * 获取全局交互系统实例
 */
let globalInstance: ReturnType<typeof useInteraction> | null = null

export function getInteraction() {
  if (!globalInstance) {
    globalInstance = useInteraction()
  }
  return globalInstance
}
