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
  [x in keyof Partial<Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions>]: ResolvedFromConfig
}>

// This represents the full configuration object including a `resolved` key
// which duplicates the config, additional additional information such as how it was resolved
// (eg from plugin, env, default etc...)
// which is used for showing the config in the UI.
export interface FullConfig extends Partial<Cypress.RuntimeConfigOptions & Cypress.ResolvedConfigOptions> {
  additionalIgnorePattern?: string | string[]
  resolved: ResolvedConfigurationOptions
}

// Cannot just use RuntimeConfigOptions as is because some types are not complete.
// Instead, this is an interface of values that have been manually validated to exist
// and are required when creating a project.
export type ReceivedCypressOptions =
  Pick<Cypress.RuntimeConfigOptions, 'hosts' | 'projectName' | 'clientRoute' | 'devServerPublicPathRoute' | 'namespace' | 'report' | 'socketIoCookie' | 'configFile' | 'isTextTerminal' | 'isNewProject' | 'proxyUrl' | 'browsers' | 'browserUrl' | 'socketIoRoute' | 'arch' | 'platform' | 'spec' | 'specs' | 'browser' | 'version' | 'remote'>
  & Pick<Cypress.ResolvedConfigOptions, 'chromeWebSecurity' | 'supportFolder' | 'experimentalSourceRewriting' | 'fixturesFolder' | 'reporter' | 'reporterOptions' | 'screenshotsFolder' | 'supportFile' | 'baseUrl' | 'viewportHeight' | 'viewportWidth' | 'port' | 'experimentalInteractiveRunEvents' | 'userAgent' | 'downloadsFolder' | 'env' | 'excludeSpecPattern' | 'specPattern' | 'experimentalSessionAndOrigin'> // TODO: Figure out how to type this better.

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
