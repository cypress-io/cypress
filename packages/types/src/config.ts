/// <reference path="../../../cli/types/cypress.d.ts" />

export const RESOLVED_FROM = ['plugin', 'env', 'default', 'runtime', 'config', 'cli'] as const

export type ResolvedConfigurationOptionSource = typeof RESOLVED_FROM[number]

export type ResolvedFromConfig = {
  from: ResolvedConfigurationOptionSource
  // TODO: Generic somehow with better type safety
  value: any
}

export type ResolvedConfigurationOptions = Partial<{
  [x in keyof Cypress.ResolvedConfigOptions]: ResolvedFromConfig
}>

export type ConfigOptions = Cypress.ConfigOptions

export type FullConfigBase =
  Cypress.InternalConfigOptions &
  Cypress.RuntimeConfigOptions &
  Cypress.ResolvedConfigOptions

// This represents the full configuration object including a `resolved` key
// which duplicates the config, addditional additional information such as how it was resolved
// (eg from plugin, env, default etc...)
// which is used for showing the config in the UI.
export interface FullConfig extends FullConfigBase {
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

// Options that are passed when running through `cypress run` or `cypress open`

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
  configFile?: string | null
  [key: string]: unknown
}

export interface OpenModeConfig extends Cypress.ConfigOptions {
  [key: string]: unknown
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
