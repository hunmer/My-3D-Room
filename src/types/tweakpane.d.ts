declare module 'tweakpane' {
  import { BladeApi } from 'tweakpane/dist/tweakpane.js'

  export interface PaneConfig {
    title?: string
    width?: number
    container?: HTMLElement
    expanded?: boolean
  }

  export class Pane {
    constructor(config?: PaneConfig)
    element: HTMLElement | null
    addInput<T extends object, P extends keyof T>(obj: T, prop: P, config?: any): InputBindingApi
    addButton(config: any): ButtonApi
    addFolder(config: any): FolderApi
    clear(): void
    dispose(): void
    refresh(): void
  }

  export interface InputBindingApi extends BladeApi {
    on(event: string, callback: (ev: any) => void): void
    refresh(): void
  }

  export interface ButtonApi extends BladeApi {
    on(event: string, callback: () => void): void
  }

  export interface FolderApi extends BladeApi {
    addInput<T extends object, P extends keyof T>(obj: T, prop: P, config?: any): InputBindingApi
    addButton(config: any): ButtonApi
    addFolder(config: any): FolderApi
  }

  export { BladeApi }
}
