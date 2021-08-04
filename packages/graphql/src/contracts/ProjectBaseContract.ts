export interface ProjectBaseContract {
  isOpen: boolean
  initializePlugins(): Promise<unknown>
  createConfigFile ({ code, configFilename }: { code: string, configFilename: string }): void
}
