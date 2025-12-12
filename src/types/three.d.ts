import * as THREE from 'three'

// Three.js 组件类型定义
export interface ThreeComponent {
  update: (deltaTime?: number) => void
  dispose?: () => void
}

// Experience 配置类型
export interface ExperienceConfig {
  pixelRatio: number
  width: number
  height: number
  debug: boolean
}

// 资源项类型
export interface ResourceItem {
  name: string
  type: 'texture' | 'model' | 'video' | 'audio'
  source: string
  data?: any
}

// 资源组类型
export interface ResourceGroup {
  name: string
  items: ResourceItem[]
}

// 相机模式类型
export interface CameraMode {
  instance: THREE.PerspectiveCamera
  controls?: any
}

// 调试参数类型
export interface DebugParam {
  [key: string]: {
    min?: number
    max?: number
    step?: number
    value?: number
  }
}
