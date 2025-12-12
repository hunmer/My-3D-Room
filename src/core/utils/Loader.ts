import * as THREE from 'three'
import { EventEmitter } from './EventEmitter'

/**
 * 简化的资源加载器
 */
export class Loader {
  private textureLoader: THREE.TextureLoader
  private eventEmitter: EventEmitter<{ loaded: number; total: number; item: any }> = new EventEmitter()

  constructor() {
    this.textureLoader = new THREE.TextureLoader()
  }

  /**
   * 加载纹理
   */
  loadTexture(url: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture: THREE.Texture) => {
          texture.wrapS = THREE.RepeatWrapping
          texture.wrapT = THREE.RepeatWrapping
          resolve(texture)
        },
        undefined,
        reject
      )
    })
  }

  /**
   * 监听加载进度
   */
  onProgress(callback: (data: { loaded: number; total: number; item: any }) => void): void {
    this.eventEmitter.on('progress', callback)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.eventEmitter.clear()
  }
}
