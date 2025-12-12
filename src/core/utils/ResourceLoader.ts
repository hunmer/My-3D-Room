import * as THREE from 'three'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { EventEmitter } from './EventEmitter'

export interface LoadedResource {
  name: string
  type: 'texture' | 'model' | 'video'
  data: THREE.Texture | GLTF | HTMLVideoElement
}

export interface ResourceItem {
  name: string
  source: string
  type: 'texture' | 'model' | 'video'
}

export interface LoadProgress {
  loaded: number
  total: number
  progress: number
  item?: ResourceItem
}

/**
 * 资源加载器 - 支持 GLB 模型、纹理和视频
 */
export class ResourceLoader {
  private gltfLoader: GLTFLoader
  private dracoLoader: DRACOLoader
  private textureLoader: THREE.TextureLoader
  private eventEmitter: EventEmitter<LoadProgress>

  public items: Map<string, LoadedResource> = new Map()

  constructor() {
    // 初始化 DRACO 解码器
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/gltf/')

    // 初始化 GLTF 加载器
    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.setDRACOLoader(this.dracoLoader)

    // 初始化纹理加载器
    this.textureLoader = new THREE.TextureLoader()

    // 事件发射器
    this.eventEmitter = new EventEmitter()
  }

  /**
   * 加载单个纹理
   */
  private loadTexture(item: ResourceItem): Promise<LoadedResource> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        item.source,
        (texture) => {
          // 设置纹理属性
          texture.flipY = false
          texture.colorSpace = THREE.SRGBColorSpace

          resolve({
            name: item.name,
            type: 'texture',
            data: texture
          })
        },
        undefined,
        (error) => reject(error)
      )
    })
  }

  /**
   * 加载单个 GLTF/GLB 模型
   */
  private loadModel(item: ResourceItem): Promise<LoadedResource> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        item.source,
        (gltf) => {
          resolve({
            name: item.name,
            type: 'model',
            data: gltf
          })
        },
        undefined,
        (error) => reject(error)
      )
    })
  }

  /**
   * 加载视频
   */
  private loadVideo(item: ResourceItem): Promise<LoadedResource> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.src = item.source
      video.muted = true
      video.playsInline = true
      video.autoplay = true
      video.loop = true

      video.addEventListener('loadeddata', () => {
        video.play()
        resolve({
          name: item.name,
          type: 'video',
          data: video
        })
      })

      video.addEventListener('error', () => {
        reject(new Error(`Failed to load video: ${item.source}`))
      })
    })
  }

  /**
   * 加载单个资源
   */
  private async loadItem(item: ResourceItem): Promise<LoadedResource> {
    switch (item.type) {
      case 'texture':
        return this.loadTexture(item)
      case 'model':
        return this.loadModel(item)
      case 'video':
        return this.loadVideo(item)
      default:
        throw new Error(`Unknown resource type: ${item.type}`)
    }
  }

  /**
   * 加载多个资源
   */
  async load(items: ResourceItem[]): Promise<Map<string, LoadedResource>> {
    const total = items.length
    let loaded = 0

    // 发送初始进度
    this.eventEmitter.emit('progress', {
      loaded: 0,
      total,
      progress: 0
    })

    // 并行加载所有资源
    const promises = items.map(async (item) => {
      try {
        const resource = await this.loadItem(item)
        this.items.set(item.name, resource)

        loaded++
        this.eventEmitter.emit('progress', {
          loaded,
          total,
          progress: (loaded / total) * 100,
          item
        })

        return resource
      } catch (error) {
        console.error(`Failed to load resource: ${item.name}`, error)
        loaded++
        this.eventEmitter.emit('progress', {
          loaded,
          total,
          progress: (loaded / total) * 100,
          item
        })
        return null
      }
    })

    await Promise.all(promises)

    // 触发加载完成事件
    this.eventEmitter.emit('ready', {
      loaded: total,
      total,
      progress: 100
    })

    return this.items
  }

  /**
   * 获取资源
   */
  get<T = LoadedResource['data']>(name: string): T | undefined {
    const resource = this.items.get(name)
    return resource?.data as T | undefined
  }

  /**
   * 监听加载进度
   */
  onProgress(callback: (progress: LoadProgress) => void): void {
    this.eventEmitter.on('progress', callback)
  }

  /**
   * 监听加载完成
   */
  onReady(callback: (progress: LoadProgress) => void): void {
    this.eventEmitter.on('ready', callback)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.dracoLoader.dispose()
    this.items.forEach((resource) => {
      if (resource.type === 'texture' && resource.data instanceof THREE.Texture) {
        resource.data.dispose()
      }
      if (resource.type === 'video' && resource.data instanceof HTMLVideoElement) {
        resource.data.pause()
        resource.data.src = ''
      }
    })
    this.items.clear()
    this.eventEmitter.clear()
  }
}
