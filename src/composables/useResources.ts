import { ref, shallowRef, readonly } from 'vue'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { ResourceLoader, LoadedResource, LoadProgress } from '@/core/utils/ResourceLoader'
import assets from '@/assets'

/**
 * 资源管理 Composable
 * 统一管理所有 3D 资源的加载和访问
 */
export function useResources() {
  // 资源加载器（使用 shallowRef 避免 Proxy 问题）
  const loader = shallowRef<ResourceLoader>(new ResourceLoader())

  // 加载状态
  const isLoading = ref(true)
  const loadingProgress = ref(0)
  const loadedItems = ref(0)
  const totalItems = ref(0)

  // 资源存储
  const resources = shallowRef<Map<string, LoadedResource>>(new Map())

  /**
   * 加载所有资源
   */
  const loadAll = async (): Promise<void> => {
    // 获取所有资源项
    const allItems = assets.flatMap(group => group.items)
    totalItems.value = allItems.length

    // 监听加载进度
    loader.value.onProgress((progress: LoadProgress) => {
      loadedItems.value = progress.loaded
      loadingProgress.value = progress.progress
    })

    // 监听加载完成
    loader.value.onReady(() => {
      isLoading.value = false
      resources.value = loader.value.items
    })

    // 开始加载
    await loader.value.load(allItems)
  }

  /**
   * 获取纹理资源
   */
  const getTexture = (name: string): THREE.Texture | undefined => {
    return loader.value.get<THREE.Texture>(name)
  }

  /**
   * 获取模型资源
   */
  const getModel = (name: string): GLTF | undefined => {
    return loader.value.get<GLTF>(name)
  }

  /**
   * 获取视频资源
   */
  const getVideo = (name: string): HTMLVideoElement | undefined => {
    return loader.value.get<HTMLVideoElement>(name)
  }

  /**
   * 检查资源是否存在
   */
  const hasResource = (name: string): boolean => {
    return loader.value.items.has(name)
  }

  /**
   * 销毁资源
   */
  const destroy = (): void => {
    loader.value.destroy()
  }

  return {
    // 状态
    isLoading: readonly(isLoading),
    loadingProgress: readonly(loadingProgress),
    loadedItems: readonly(loadedItems),
    totalItems: readonly(totalItems),

    // 方法
    loadAll,
    getTexture,
    getModel,
    getVideo,
    hasResource,
    destroy,

    // 原始访问
    loader
  }
}

// 创建单例实例
let resourcesInstance: ReturnType<typeof useResources> | null = null

/**
 * 获取资源管理器单例
 */
export function getResources(): ReturnType<typeof useResources> {
  if (!resourcesInstance) {
    resourcesInstance = useResources()
  }
  return resourcesInstance
}
