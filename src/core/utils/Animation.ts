import gsap from 'gsap'
import * as THREE from 'three'

/**
 * GSAP 动画工具类
 */
export class Animation {
  private static instance: Animation | null = null
  private timeline: gsap.core.Timeline | null = null

  /**
   * 单例模式
   */
  static getInstance(): Animation {
    if (!Animation.instance) {
      Animation.instance = new Animation()
    }
    return Animation.instance
  }

  /**
   * 创建主时间轴
   */
  createTimeline(): gsap.core.Timeline {
    this.timeline = gsap.timeline({ repeat: -1, yoyo: true })
    return this.timeline
  }

  /**
   * 获取主时间轴
   */
  getTimeline(): gsap.core.Timeline | null {
    return this.timeline
  }

  /**
   * 为 Three.js 对象创建动画
   */
  animateThreeJS(
    object: THREE.Object3D,
    property: string,
    value: number | THREE.Vector3,
    duration: number = 1,
    ease: string = 'power2.inOut'
  ): gsap.core.Tween {
    const target: any = {}
    target[property] = value

    return gsap.to(object, {
      ...target,
      duration,
      ease,
      onUpdate: () => {
        // 触发渲染更新
      }
    })
  }

  /**
   * 创建 LED 闪烁动画
   */
  createLedBlinkAnimation(
    material: THREE.MeshBasicMaterial,
    baseOpacity: number = 0.5,
    amplitude: number = 0.5,
    frequency: number = 0.002
  ): gsap.core.Tween {
    return gsap.to(material, {
      opacity: () => baseOpacity + amplitude * Math.sin(performance.now() * frequency),
      duration: 0.016, // 60fps
      repeat: -1,
      ease: 'none'
    })
  }

  /**
   * 创建颜色渐变动画
   */
  animateColor(
    material: THREE.MeshBasicMaterial,
    colors: string[],
    duration: number = 2
  ): gsap.core.Tween {
    const colorObject = { r: 1, g: 1, b: 1 }
    const currentColor = new THREE.Color(colors[0])

    colorObject.r = currentColor.r
    colorObject.g = currentColor.g
    colorObject.b = currentColor.b

    return gsap.to(colorObject, {
      r: new THREE.Color(colors[1]).r,
      g: new THREE.Color(colors[1]).g,
      b: new THREE.Color(colors[1]).b,
      duration,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
      onUpdate: () => {
        material.color.setRGB(colorObject.r, colorObject.g, colorObject.b)
      }
    })
  }

  /**
   * 创建位置动画
   */
  animatePosition(
    object: THREE.Object3D,
    position: THREE.Vector3 | { x: number; y: number; z: number },
    duration: number = 1,
    ease: string = 'power2.inOut'
  ): gsap.core.Tween {
    return gsap.to(object.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration,
      ease
    })
  }

  /**
   * 创建缩放动画
   */
  animateScale(
    object: THREE.Object3D,
    scale: number | { x: number; y: number; z: number },
    duration: number = 1,
    ease: string = 'power2.inOut'
  ): gsap.core.Tween {
    const target = typeof scale === 'number'
      ? { x: scale, y: scale, z: scale }
      : scale

    return gsap.to(object.scale, {
      ...target,
      duration,
      ease
    })
  }

  /**
   * 创建旋转动画
   */
  animateRotation(
    object: THREE.Object3D,
    rotation: { x?: number; y?: number; z?: number },
    duration: number = 1,
    ease: string = 'power2.inOut'
  ): gsap.core.Tween {
    const target: any = {}
    if (rotation.x !== undefined) target.rotationX = rotation.x
    if (rotation.y !== undefined) target.rotationY = rotation.y
    if (rotation.z !== undefined) target.rotationZ = rotation.z

    return gsap.to(object.rotation, {
      ...target,
      duration,
      ease
    })
  }

  /**
   * 批量动画
   */
  animateMultiple(
    objects: Array<{
      object: THREE.Object3D
      property: string
      value: number | THREE.Vector3
      duration?: number
      ease?: string
    }>
  ): gsap.core.Tween[] {
    return objects.map(({ object, property, value, duration = 1, ease = 'power2.inOut' }) =>
      this.animateThreeJS(object, property, value, duration, ease)
    )
  }

  /**
   * 缓动函数
   */
  static get easing() {
    return {
      linear: 'none',
      easeIn: 'power1.in',
      easeOut: 'power1.out',
      easeInOut: 'power1.inOut',
      backInOut: 'back.inOut',
      bounceInOut: 'bounce.inOut',
      elasticInOut: 'elastic.inOut'
    }
  }

  /**
   * 清理动画
   */
  static killTweensOf(target: any): void {
    gsap.killTweensOf(target)
  }

  /**
   * 暂停所有动画
   */
  pauseAll(): void {
    gsap.globalTimeline.pause()
  }

  /**
   * 恢复所有动画
   */
  resumeAll(): void {
    gsap.globalTimeline.resume()
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.timeline) {
      this.timeline.kill()
      this.timeline = null
    }
    gsap.globalTimeline.clear()
  }
}

// 导出 GSAP 实例
export { gsap }
export default Animation
