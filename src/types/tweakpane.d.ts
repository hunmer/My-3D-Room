declare module 'tweakpane' {
  import { BladeApi } from 'tweakpane/dist/tweakpane.js'

  export interface PaneConfig {
    title?: string
    width?: number
  }

  export class Pane {
    constructor(config?: PaneConfig)
    element: HTMLElement | null
    addBinding<T extends object, P extends keyof T>(obj: T, prop: P, config?: any): BindingApi
    addButton(config: any): ButtonApi
    addFolder(config: any): FolderApi
    clear(): void
    dispose(): void
  }

  export interface BindingApi extends BladeApi {
    on(event: string, callback: (ev: any) => void): void
  }

  export interface ButtonApi extends BladeApi {
    on(event: string, callback: () => void): void
  }

  export interface FolderApi extends BladeApi {
    addBinding<T extends object, P extends keyof T>(obj: T, prop: P, config?: any): BindingApi
    addButton(config: any): ButtonApi
    addFolder(config: any): FolderApi
  }

  export { BladeApi }
}
