export type InstallCommand = {
  cmd: string
  env?: Record<string, string>
}

export type InstallCommandOpts = {
  yarnV311: boolean
  updateLockFile: boolean
  isCI: boolean
  runScripts: boolean
  ignoreEngines?: boolean
}
