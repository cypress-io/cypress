/// <reference path="../../../cli/types/cypress.d.ts" />

export const RESOLVED_FROM = ['plugin', 'env', 'default', 'runtime', 'config'] as const

export type ResolvedConfigurationOptionSource = typeof RESOLVED_FROM[number]

export type ResolvedFromConfig = {
  from: ResolvedConfigurationOptionSource
  // TODO: Generic somehow with better type safety
  value: any
}

export type ResolvedConfigurationOptions = Partial<{
  [x in keyof Cypress.ResolvedConfigOptions]: ResolvedFromConfig
}>

// This represents the full configuration object including a `resolved` key
// which duplicates the config, addditional additional information such as how it was resolved
// (eg from plugin, env, default etc...)
// which is used for showing the config in the UI.
export interface FullConfig extends Partial<Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions> {
  resolved: ResolvedConfigurationOptions
}

export interface SampleConfigFile {
  status: 'changes' | 'valid' | 'skipped' | 'error'
  filePath: string
  content: string
  description?: string
  warningText?: string
  warningLink?: string
}

export interface SettingsOptions {
  testingType?: 'component' |'e2e'
  configFile?: string | false
  args?: {
    runProject?: string
  }
}

export type ClientCertificate = Cypress.ClientCertificate

export type ModeConfig = {
  mode: 'open'
  options: OpenModeOptions
} | {
  mode: 'run'
  options: RunModeOptions
}

export interface OpenModeOptions {
  _?: (string | null)[] | null
  config: OpenModeConfig
  cwd: string
  invokedFromCli: boolean
  updating?: boolean | null
  foo?: string | null
  configFile?: string | null
}

export interface OpenModeConfig {
  test?: boolean | null
  foo?: string | null
  trashAssetsBeforeRuns?: boolean | null
  pageLoadTimeout?: number | null
  port?: number | null
  env?: Record<string, string> | null
}

export interface RunModeOptions {
  _?: (null)[] | null
  runProject: string
  invokedFromCli: boolean
  cwd: string
  config: RunModeConfig
  projectRoot: string
  headless?: boolean | null
  headed?: boolean | null
  spec?: (string)[] | null
  isTextTerminal?: boolean | null
  key?: string | null
  record?: boolean | null
  browser?: string | null
  configFile?: boolean | string
  group?: string | null
  parallel?: boolean | null
  ciBuildId?: string | null
  tag?: (string)[] | null
}

export interface RunModeConfig {
  port?: number | null
  testFiles?: string | (string)[] | null
  reporter?: string | null
  baseUrl?: string | null
  blacklistHosts?: string | null
  integrationFolder?: string | null
  requestTimeout?: number | null
  videoCompression?: boolean | null
  env?: Record<string, string> | null
  video?: boolean | null
}
