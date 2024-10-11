/// <reference path="../../../cli/types/cypress.d.ts" />

import type { AllModeOptions, TestingType } from '.'

export const RESOLVED_FROM = ['default', 'config', 'plugin', 'envFile', 'env', 'cli', 'runtime'] as const

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
  & Pick<Cypress.ResolvedConfigOptions, 'chromeWebSecurity' | 'supportFolder' | 'experimentalSourceRewriting' | 'fixturesFolder' | 'reporter' | 'reporterOptions' | 'screenshotsFolder' | 'supportFile' | 'baseUrl' | 'viewportHeight' | 'viewportWidth' | 'port' | 'experimentalInteractiveRunEvents' | 'userAgent' | 'downloadsFolder' | 'env' | 'excludeSpecPattern' | 'specPattern' | 'experimentalModifyObstructiveThirdPartyCode' | 'experimentalSkipDomainInjection' | 'video' | 'videoCompression' | 'videosFolder' | 'resolvedNodeVersion' | 'resolvedNodePath' | 'trashAssetsBeforeRuns' | 'experimentalWebKitSupport' | 'justInTimeCompile'> // TODO: Figure out how to type this better.

export interface SettingsOptions {
  testingType?: 'component' |'e2e'
  args?: AllModeOptions
}

export type BannerState = {
  lastShown?: number
  dismissed?: number
}

export const BannerIds = {
  ACI_082022_LOGIN: 'aci_082022_login',
  ACI_082022_CREATE_ORG: 'aci_082022_createOrganization',
  ACI_082022_CONNECT_PROJECT: 'aci_082022_connectProject',
  ACI_082022_RECORD: 'aci_082022_record',
  CT_052023_AVAILABLE: 'ct_052023_available',
  ACI_052023_NO_RUNS_FOUND_FOR_BRANCH: 'aci_052023_noRunsFoundForBranch',
  ACI_052023_GIT_NOT_DETECTED: 'aci_052023_gitNotDetected',
} as const

type BannerKeys = keyof typeof BannerIds
type BannerId = typeof BannerIds[BannerKeys]
export type BannersState = {
  [bannerId in BannerId]?: BannerState
} & { _disabled?: boolean } // used for testing

export type MajorVersionWelcomeDismissed = {
  [key: string]: number
}

export type BreakingErrResult = {
  name: string
  newName?: string
  value?: any
  configFile: string
  testingType?: TestingType
}
