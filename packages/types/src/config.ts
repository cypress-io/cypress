/// <reference path="../../../cli/types/cypress.d.ts" />

import type { AllModeOptions } from '.'

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

export interface SampleConfigFile{
  status: 'changes' | 'valid' | 'skipped' | 'error'
  filePath: string
  content: string
  description?: string
  warningText?: string
  warningLink?: string
}

export interface SettingsOptions {
  testingType?: 'component' |'e2e'
  args?: AllModeOptions
}
