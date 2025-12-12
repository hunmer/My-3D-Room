import { ref, shallowRef, watch, onUnmounted } from 'vue'
import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * TransformControls 模式
 */
export type TransformMode = 'translate' | 'rotate' | 'scale'

/**
 * TransformControls 空间
 */
export type TransformSpace = 'world' | 'local'

/**
 * TransformControls 配置
 */
export interface TransformControlsConfig {
  /** 初始模式 */
  mode?: TransformMode
  /** 坐标空间 */
  space?: TransformSpace
  /** 控件大小 */
  size?: number
  /** 是否显示 X 轴 */
  showX?: boolean
  /** 是否显示 Y 轴 */
  showY?: boolean
  /** 是否显示 Z 轴 */
  showZ?: boolean
  /** 平移吸附（null 禁用） */
  translationSnap?: number | null
  /** 旋转吸附（弧度，null 禁用） */
  rotationSnap?: number | null
  /** 缩放吸附（null 禁用） */
  scaleSnap?: number | null
}

// 全局单例状态
let transformControls: TransformControls | null = null
let orbitControls: OrbitControls | null = null
let scene: THREE.Scene | null = null
let isInitialized = false

// 当前附加的对象
const attachedObject = shallowRef<THREE.Object3D | null>(null)

// 是否正在拖动
const isDragging = ref(false)

// 当前模式
const currentMode = ref<TransformMode>('translate')

// 当前空间
const currentSpace = ref<TransformSpace>('local')

// 是否可见
const isVisible = ref(false)

// 变换改变回调
type TransformChangeCallback = (object: THREE.Object3D) => void
const changeCallbacks: Set<TransformChangeCallback> = new Set()

/**
 * TransformControls 管理 Composable
 * 提供模型变换控制功能
 */
export function useTransformControls() {
  /**
   * 初始化 TransformControls
   */
  const init = (
    camera: THREE.Camera,
    domElement: HTMLElement,
    sceneInstance: THREE.Scene,
    orbitControlsInstance?: OrbitControls | null
  ) => {
    if (isInitialized) return

    scene = sceneInstance
    orbitControls = orbitControlsInstance ?? null

    // 创建 TransformControls
    transformControls = new TransformControls(camera, domElement)
    transformControls.setMode(currentMode.value)
    transformControls.setSpace(currentSpace.value)

    // 添加到场景（TransformControls 继承自 Object3D）
    scene.add(transformControls as unknown as THREE.Object3D)

    // 监听拖动状态，禁用/启用 OrbitControls
    transformControls.addEventListener('dragging-changed', (event) => {
      const dragging = event.value as boolean
      isDragging.value = dragging
      if (orbitControls) {
        orbitControls.enabled = !dragging
      }
    })

    // 监听变换改变
    transformControls.addEventListener('change', () => {
      if (attachedObject.value) {
        changeCallbacks.forEach(cb => cb(attachedObject.value!))
      }
    })

    isInitialized = true
    console.log('🎮 TransformControls initialized')
  }

  /**
   * 附加到对象
   */
  const attach = (object: THREE.Object3D, config?: TransformControlsConfig) => {
    if (!transformControls) {
      console.warn('TransformControls not initialized')
      return
    }

    // 应用配置
    if (config) {
      if (config.mode) setMode(config.mode)
      if (config.space) setSpace(config.space)
      if (config.size !== undefined) transformControls.setSize(config.size)
      if (config.showX !== undefined) transformControls.showX = config.showX
      if (config.showY !== undefined) transformControls.showY = config.showY
      if (config.showZ !== undefined) transformControls.showZ = config.showZ
      if (config.translationSnap !== undefined) {
        transformControls.setTranslationSnap(config.translationSnap)
      }
      if (config.rotationSnap !== undefined) {
        transformControls.setRotationSnap(config.rotationSnap)
      }
      if (config.scaleSnap !== undefined) {
        transformControls.setScaleSnap(config.scaleSnap)
      }
    }

    transformControls.attach(object)
    attachedObject.value = object
    isVisible.value = true

    console.log('🎮 TransformControls attached to:', object.name || object.type)
  }

  /**
   * 分离对象
   */
  const detach = () => {
    if (!transformControls) return

    transformControls.detach()
    attachedObject.value = null
    isVisible.value = false

    console.log('🎮 TransformControls detached')
  }

  /**
   * 切换附加状态（已附加则分离，未附加则附加）
   */
  const toggle = (object: THREE.Object3D, config?: TransformControlsConfig) => {
    if (attachedObject.value === object) {
      detach()
    } else {
      attach(object, config)
    }
  }

  /**
   * 设置变换模式
   */
  const setMode = (mode: TransformMode) => {
    currentMode.value = mode
    if (transformControls) {
      transformControls.setMode(mode)
    }
  }

  /**
   * 切换到下一个模式
   */
  const cycleMode = () => {
    const modes: TransformMode[] = ['translate', 'rotate', 'scale']
    const currentIndex = modes.indexOf(currentMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setMode(modes[nextIndex])
  }

  /**
   * 设置坐标空间
   */
  const setSpace = (space: TransformSpace) => {
    currentSpace.value = space
    if (transformControls) {
      transformControls.setSpace(space)
    }
  }

  /**
   * 切换坐标空间
   */
  const toggleSpace = () => {
    setSpace(currentSpace.value === 'world' ? 'local' : 'world')
  }

  /**
   * 设置控件大小
   */
  const setSize = (size: number) => {
    if (transformControls) {
      transformControls.setSize(size)
    }
  }

  /**
   * 注册变换改变回调
   */
  const onTransformChange = (callback: TransformChangeCallback) => {
    changeCallbacks.add(callback)
    return () => changeCallbacks.delete(callback)
  }

  /**
   * 销毁
   */
  const destroy = () => {
    if (transformControls) {
      transformControls.detach()
      if (scene) {
        scene.remove(transformControls as unknown as THREE.Object3D)
      }
      transformControls.dispose()
      transformControls = null
    }

    scene = null
    orbitControls = null
    attachedObject.value = null
    isVisible.value = false
    isDragging.value = false
    changeCallbacks.clear()
    isInitialized = false

    console.log('🎮 TransformControls destroyed')
  }

  /**
   * 更新 OrbitControls 引用
   */
  const updateOrbitControls = (controls: OrbitControls | null) => {
    orbitControls = controls
  }

  return {
    // 状态
    attachedObject,
    isDragging,
    currentMode,
    currentSpace,
    isVisible,

    // 方法
    init,
    attach,
    detach,
    toggle,
    setMode,
    cycleMode,
    setSpace,
    toggleSpace,
    setSize,
    onTransformChange,
    updateOrbitControls,
    destroy
  }
}

// 全局单例
let globalInstance: ReturnType<typeof useTransformControls> | null = null

/**
 * 获取全局 TransformControls 实例
 */
export function getTransformControls() {
  if (!globalInstance) {
    globalInstance = useTransformControls()
  }
  return globalInstance
}
