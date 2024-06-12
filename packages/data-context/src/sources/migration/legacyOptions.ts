interface ResolvedConfigOption {
  name: string
  defaultValue?: any
  isFolder?: boolean
  isExperimental?: boolean
  /**
   * Can be mutated with Cypress.config() or test-specific configuration overrides
   */
  canUpdateDuringTestTime?: boolean
}

interface RuntimeConfigOption {
  name: string
  defaultValue: any
  isInternal?: boolean
  /**
   * Can be mutated with Cypress.config() or test-specific configuration overrides
   */
  canUpdateDuringTestTime?: boolean
}

export const legacyIntegrationFolder = 'cypress/integration'
// NOTE:
// If you add/remove/change a config value, make sure to update the following
// - cli/types/index.d.ts (including allowed config options on TestOptions)
// - cypress.schema.json
//
// Add options in alphabetical order for better readability

// TODO - add boolean attribute to indicate read-only / static vs mutable options
// that can be updated during test executions
const resolvedOptions: Array<ResolvedConfigOption> = [
  {
    name: 'animationDistanceThreshold',
    defaultValue: 5,
    canUpdateDuringTestTime: true,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    canUpdateDuringTestTime: true,
  }, {
    name: 'blockHosts',
    defaultValue: null,
    canUpdateDuringTestTime: true,
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    canUpdateDuringTestTime: false,
  }, {
    name: 'component',
    // runner-ct overrides
    defaultValue: {},
    canUpdateDuringTestTime: false,
  }, {
    name: 'componentFolder',
    defaultValue: 'cypress/component',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {},
    canUpdateDuringTestTime: false,
  }, {
    name: 'env',
    defaultValue: {},
    canUpdateDuringTestTime: true,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'exit',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalStudio',
    defaultValue: false,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'ignoreTestFiles',
    defaultValue: '*.hot-update.js',
    canUpdateDuringTestTime: true,
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    canUpdateDuringTestTime: true,
  }, {
    name: 'integrationFolder',
    defaultValue: legacyIntegrationFolder,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'keystrokeDelay',
    defaultValue: 0,
    canUpdateDuringTestTime: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'nodeVersion',
    canUpdateDuringTestTime: false,
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    canUpdateDuringTestTime: true,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'pluginsFile',
    defaultValue: 'cypress/plugins',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'port',
    defaultValue: null,
    canUpdateDuringTestTime: true,
  }, {
    name: 'projectId',
    defaultValue: null,
    canUpdateDuringTestTime: true,
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    canUpdateDuringTestTime: true,
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'resolvedNodePath',
    defaultValue: null,
    canUpdateDuringTestTime: false,
  }, {
    name: 'resolvedNodeVersion',
    defaultValue: null,
    canUpdateDuringTestTime: false,
  }, {
    name: 'responseTimeout',
    defaultValue: 30000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'slowTestThreshold',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    canUpdateDuringTestTime: true,
  }, {
    name: 'supportFile',
    defaultValue: 'cypress/support',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'testFiles',
    defaultValue: '**/*.*',
    canUpdateDuringTestTime: false,
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'userAgent',
    defaultValue: null,
    canUpdateDuringTestTime: false,
  }, {
    name: 'video',
    defaultValue: false,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoCompression',
    defaultValue: 32,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoUploadOnPasses',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'viewportHeight',
    defaultValue: 660,
    canUpdateDuringTestTime: true,
  }, {
    name: 'viewportWidth',
    defaultValue: 1000,
    canUpdateDuringTestTime: true,
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    canUpdateDuringTestTime: true,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    name: 'browsers',
    defaultValue: [],
    canUpdateDuringTestTime: false,
  }, {
    name: 'hosts',
    defaultValue: null,
    canUpdateDuringTestTime: false,
  }, {
    name: 'isInteractive',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    canUpdateDuringTestTime: false,
  },
]

export const legacyOptions: Array<ResolvedConfigOption|RuntimeConfigOption> = [
  ...resolvedOptions,
  ...runtimeOptions,
]
