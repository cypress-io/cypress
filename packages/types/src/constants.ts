import type { SpecFile } from './spec'

export const PLUGINS_STATE = ['uninitialized', 'initializing', 'initialized', 'error'] as const

export type PluginsState = typeof PLUGINS_STATE[number]

export const CODE_LANGUAGES = [
  {
    type: 'js',
    name: 'JavaScript',
  },
  {
    type: 'ts',
    name: 'TypeScript',
  },
] as const

export type CodeLanguage = typeof CODE_LANGUAGES[number]

export const MIGRATION_STEPS = ['renameAuto', 'renameManual', 'renameSupport', 'configFile', 'setupComponent'] as const

export type MigrationStep = typeof MIGRATION_STEPS[number]

export const PACKAGE_MANAGERS = ['npm', 'yarn', 'pnpm'] as const

// Note: ONLY change this in code that will be merged into a release branch
// for a new major version of Cypress
export const MAJOR_VERSION_FOR_CONTENT = '13'

export const RUN_ALL_SPECS_KEY = '__all' as const

export const RUN_ALL_SPECS: SpecFile = {
  name: 'All E2E Specs',
  absolute: RUN_ALL_SPECS_KEY,
  relative: RUN_ALL_SPECS_KEY,
  baseName: RUN_ALL_SPECS_KEY,
  fileName: RUN_ALL_SPECS_KEY,
}

/**
 * In cypress-in-cypress tests that visit the app in open mode,
 * we use this to make `isRunMode` true on the UI side so that
 * we can test some run-mode-specific UI features
 */
export const CY_IN_CY_SIMULATE_RUN_MODE = 'CY_IN_CY_SIMULATE_RUN_MODE'

// These are the URLS that we use to get the Cypress version and release time
export const CYPRESS_REMOTE_MANIFEST_URL = 'https://download.cypress.io/desktop.json'

export const NPM_CYPRESS_REGISTRY_URL = 'https://registry.npmjs.org/cypress'
