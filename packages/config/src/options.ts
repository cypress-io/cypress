import os from 'os'
import * as validate from './validation'
// @ts-ignore
import pkg from '@packages/root'

export type BreakingOptionErrorKey =
  | 'RENAMED_CONFIG_OPTION'
  | 'EXPERIMENTAL_COMPONENT_TESTING_REMOVED'
  | 'EXPERIMENTAL_SAMESITE_REMOVED'
  | 'EXPERIMENTAL_NETWORK_STUBBING_REMOVED'
  | 'EXPERIMENTAL_RUN_EVENTS_REMOVED'
  | 'EXPERIMENTAL_SHADOW_DOM_REMOVED'
  | 'FIREFOX_GC_INTERVAL_REMOVED'
  | 'NODE_VERSION_DEPRECATION_SYSTEM'
  | 'NODE_VERSION_DEPRECATION_BUNDLED'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT'
  | 'TEST_FILES_DEPRECATION'

type TestingType = 'e2e' | 'component'

interface ResolvedConfigOption {
  name: string
  defaultValue?: any
  validation: Function
  isFolder?: boolean
  isExperimental?: boolean
  /**
   * Can be mutated with Cypress.config() or test-specific configuration overrides
   */
  canUpdateDuringTestTime?: boolean
  specificTestingType?: TestingType
}

interface RuntimeConfigOption {
  name: string
  defaultValue: any
  validation: Function
  isInternal?: boolean
  /**
   * Can be mutated with Cypress.config() or test-specific configuration overrides
   */
  canUpdateDuringTestTime?: boolean
}

export interface BreakingOption {
  /**
   * The non-passive configuration option.
   */
  name: string
  /**
   * String to summarize the error messaging that is logged.
   */
  errorKey: BreakingOptionErrorKey
  /**
   * Array of testing types this config option is valid for
   */
  testingTypes?: TestingType[]
  /**
   * Configuration value of the configuration option to check against.
   */
  value?: string
  /**
   * The new configuration key that is replacing the existing configuration key.
   */
  newName?: string
  /**
   * Whether to log the error message as a warning instead of throwing an error.
   */
  isWarning?: boolean
}

const isValidConfig = (key: string, config: any) => {
  const status = validate.isPlainObject(key, config)

  if (status !== true) {
    return status
  }

  for (const rule of options) {
    if (rule.name in config && rule.validation) {
      const status = rule.validation(`${key}.${rule.name}`, config[rule.name])

      if (status !== true) {
        return status
      }
    }
  }

  return true
}

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
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'arch',
    defaultValue: () => os.arch(),
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: validate.isFullyQualifiedUrl,
    canUpdateDuringTestTime: true,
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: true,
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: validate.isValidClientCertificatesSet,
    canUpdateDuringTestTime: false,
  }, {
    name: 'component',
    // runner-ct overrides
    defaultValue: {
      specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    },
    validation: isValidConfig,
    canUpdateDuringTestTime: false,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: validate.isString,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {
      specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    },
    validation: isValidConfig,
    canUpdateDuringTestTime: false,
  }, {
    name: 'env',
    defaultValue: {},
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: true,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'exit',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalSessionSupport',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: true,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: validate.isString,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'excludeSpecPattern',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? ['**/__snapshots__/*', '**/__image_snapshots__/*'] : '*.hot-update.js',
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: true,
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'keystrokeDelay',
    defaultValue: 0,
    validation: validate.isNumberOrFalse,
    canUpdateDuringTestTime: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'nodeVersion',
    validation: validate.isOneOf('bundled', 'system'),
    canUpdateDuringTestTime: false,
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'platform',
    defaultValue: () => os.platform(),
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'pluginsFile',
    defaultValue: 'cypress/plugins',
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'port',
    defaultValue: null,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'projectId',
    defaultValue: null,
    validation: validate.isString,
    canUpdateDuringTestTime: true,
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: validate.isString,
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: true,
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'resolvedNodePath',
    defaultValue: null,
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'resolvedNodeVersion',
    defaultValue: null,
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'responseTimeout',
    defaultValue: 30000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    validation: validate.isValidRetriesConfig,
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'slowTestThreshold',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
    canUpdateDuringTestTime: true,
  }, {
    name: 'supportFile',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 'cypress/support/component.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'userAgent',
    defaultValue: null,
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'video',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoCompression',
    defaultValue: 32,
    validation: validate.isNumberOrFalse,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    validation: validate.isString,
    isFolder: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoUploadOnPasses',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'viewportHeight',
    defaultValue: 660,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'viewportWidth',
    defaultValue: 1000,
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    name: 'autoOpen',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'browsers',
    defaultValue: [],
    validation: validate.isValidBrowserList,
    canUpdateDuringTestTime: false,
  }, {
    name: 'clientRoute',
    defaultValue: '/__/',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'configFile',
    defaultValue: 'cypress.config.js',
    validation: validate.isStringOrFalse,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'devServerPublicPathRoute',
    defaultValue: '/__cypress/src',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'hosts',
    defaultValue: null,
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: false,
  }, {
    name: 'isInteractive',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'isTextTerminal',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'morgan',
    defaultValue: true,
    validation: validate.isBoolean,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'namespace',
    defaultValue: '__cypress',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'reporterRoute',
    defaultValue: '/__cypress/reporter',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'socketId',
    defaultValue: null,
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'socketIoCookie',
    defaultValue: '__socket',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'version',
    defaultValue: pkg.version,
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  },
]

export const options: Array<ResolvedConfigOption | RuntimeConfigOption> = [
  ...resolvedOptions,
  ...runtimeOptions,
]

/**
 * Values not allowed in 10.X+ in the root, e2e and component config
 */
export const breakingOptions: Array<BreakingOption> = [
  {
    name: 'blacklistHosts',
    errorKey: 'RENAMED_CONFIG_OPTION',
    newName: 'blockHosts',
  }, {
    name: 'experimentalComponentTesting',
    errorKey: 'EXPERIMENTAL_COMPONENT_TESTING_REMOVED',
    isWarning: false,
  }, {
    name: 'experimentalGetCookiesSameSite',
    errorKey: 'EXPERIMENTAL_SAMESITE_REMOVED',
    isWarning: true,
  }, {
    name: 'experimentalNetworkStubbing',
    errorKey: 'EXPERIMENTAL_NETWORK_STUBBING_REMOVED',
    isWarning: true,
  }, {
    name: 'experimentalRunEvents',
    errorKey: 'EXPERIMENTAL_RUN_EVENTS_REMOVED',
    isWarning: true,
  }, {
    name: 'experimentalShadowDomSupport',
    errorKey: 'EXPERIMENTAL_SHADOW_DOM_REMOVED',
    isWarning: true,
  }, {
    name: 'firefoxGcInterval',
    errorKey: 'FIREFOX_GC_INTERVAL_REMOVED',
    isWarning: true,
  }, {
    name: 'nodeVersion',
    value: 'system',
    errorKey: 'NODE_VERSION_DEPRECATION_SYSTEM',
    isWarning: true,
  }, {
    name: 'nodeVersion',
    value: 'bundled',
    errorKey: 'NODE_VERSION_DEPRECATION_BUNDLED',
    isWarning: true,
  },
  {
    name: 'testFiles',
    errorKey: 'TEST_FILES_DEPRECATION',
    isWarning: false,
  },
]

export const breakingRootOptions: Array<BreakingOption> = [
  {
    name: 'supportFile',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  },
  {
    name: 'specPattern',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  },
  {
    name: 'excludeSpecPattern',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  },
  {
    name: 'baseUrl',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
    isWarning: false,
    testingTypes: ['e2e'],
  },
]

export const testingTypeBreakingOptions: { e2e: Array<BreakingOption>, component: Array<BreakingOption> } = {
  e2e: [],
  component: [
    {
      name: 'baseUrl',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT',
      isWarning: false,
    },
  ],
}
