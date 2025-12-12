/**
 * 事件发射器 - 用于组件间通信
 */
export class EventEmitter<T = any> {
  private events: Map<string, Array<(data: T) => void>> = new Map()

  /**
   * 监听事件
   */
  on(event: string, callback: (data: T) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)?.push(callback)
  }

  /**
   * 监听一次性事件
   */
  once(event: string, callback: (data: T) => void): void {
    const onceWrapper = (data: T) => {
      callback(data)
      this.off(event, onceWrapper)
    }
    this.on(event, onceWrapper)
  }

  /**
   * 取消监听事件
   */
  off(event: string, callback?: (data: T) => void): void {
    if (!callback) {
      this.events.delete(event)
      return
    }

    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
      if (callbacks.length === 0) {
        this.events.delete(event)
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, data: T): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  /**
   * 移除所有事件监听器
   */
  clear(): void {
    this.events.clear()
  }
}
