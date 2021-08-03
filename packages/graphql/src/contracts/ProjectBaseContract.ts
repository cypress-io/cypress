export interface ProjectBaseContract {
  isOpen: boolean
  initializePlugins(): Promise<unknown>
}
