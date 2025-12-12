import { EventEmitter } from './EventEmitter'

/**
 * 时间管理器 - 统一管理动画时间源
 */
export class Time {
  public startTime: number = 0
  public currentTime: number = 0
  public deltaTime: number = 0
  public elapsedTime: number = 0

  private animationFrameId: number | null = null
  private eventEmitter: EventEmitter<number> = new EventEmitter()
  private clock: boolean = false

  constructor() {
    this.startTime = performance.now()
    this.currentTime = this.startTime
    this.elapsedTime = 0
  }

  /**
   * 开始时间循环
   */
  start(): void {
    if (this.clock) return

    this.clock = true
    this.startTime = performance.now()
    this.currentTime = this.startTime

    const tick = () => {
      if (!this.clock) return

      const time = performance.now()
      this.deltaTime = (time - this.currentTime) / 1000
      this.currentTime = time
      this.elapsedTime = (time - this.startTime) / 1000

      // 触发时间更新事件
      this.eventEmitter.emit('tick', this.elapsedTime)

      this.animationFrameId = requestAnimationFrame(tick)
    }

    this.animationFrameId = requestAnimationFrame(tick)
  }

  /**
   * 停止时间循环
   */
  stop(): void {
    this.clock = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 监听时间更新
   */
  onTick(callback: (elapsedTime: number) => void): void {
    this.eventEmitter.on('tick', callback)
  }

  /**
   * 获取 FPS
   */
  getFPS(): number {
    return this.deltaTime > 0 ? 1 / this.deltaTime : 0
  }

  /**
   * 重置时间
   */
  reset(): void {
    this.startTime = performance.now()
    this.currentTime = this.startTime
    this.elapsedTime = 0
  }
}
