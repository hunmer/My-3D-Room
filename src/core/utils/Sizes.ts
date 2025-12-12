import { EventEmitter } from './EventEmitter'

/**
 * 窗口尺寸管理器
 */
export class Sizes {
  public width: number = 0
  public height: number = 0
  public pixelRatio: number = 1

  private eventEmitter: EventEmitter<{ width: number; height: number; pixelRatio: number }> = new EventEmitter()

  constructor() {
    this.updateSizes()
    window.addEventListener('resize', this.onResize.bind(this))
  }

  /**
   * 更新尺寸
   */
  private updateSizes(): void {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2)
  }

  /**
   * 窗口尺寸变化处理
   */
  private onResize(): void {
    this.updateSizes()
    this.eventEmitter.emit('resize', {
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio
    })
  }

  /**
   * 监听尺寸变化
   */
  onResizeEvent(callback: (data: { width: number; height: number; pixelRatio: number }) => void): void {
    this.eventEmitter.on('resize', callback)
  }

  /**
   * 获取屏幕宽度
   */
  getScreenWidth(): number {
    return this.width
  }

  /**
   * 获取屏幕高度
   */
  getScreenHeight(): number {
    return this.height
  }

  /**
   * 获取屏幕比例
   */
  getAspectRatio(): number {
    return this.width / this.height
  }

  /**
   * 检查是否为移动设备
   */
  isMobile(): boolean {
    return this.width < 768
  }

  /**
   * 检查是否为平板设备
   */
  isTablet(): boolean {
    return this.width >= 768 && this.width < 1024
  }

  /**
   * 检查是否为桌面设备
   */
  isDesktop(): boolean {
    return this.width >= 1024
  }

  /**
   * 销毁
   */
  destroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this))
    this.eventEmitter.clear()
  }
}
