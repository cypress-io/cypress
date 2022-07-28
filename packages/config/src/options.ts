import os from 'os'
import path from 'path'

import * as validate from './validation'
// @ts-ignore
import pkg from '@packages/root'

export type BreakingOptionErrorKey =
  | 'COMPONENT_FOLDER_REMOVED'
  | 'INTEGRATION_FOLDER_REMOVED'
  | 'CONFIG_FILE_AVOID_ROOT_CONFIG'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E'
  | 'CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT'
  | 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E'
  | 'EXPERIMENTAL_COMPONENT_TESTING_REMOVED'
  | 'EXPERIMENTAL_SAMESITE_REMOVED'
  | 'EXPERIMENTAL_NETWORK_STUBBING_REMOVED'
  | 'EXPERIMENTAL_RUN_EVENTS_REMOVED'
  | 'EXPERIMENTAL_SESSION_SUPPORT_REMOVED'
  | 'EXPERIMENTAL_SHADOW_DOM_REMOVED'
  | 'EXPERIMENTAL_STUDIO_REMOVED'
  | 'FIREFOX_GC_INTERVAL_REMOVED'
  | 'INVALID_CONFIG_OPTION'
  | 'NODE_VERSION_DEPRECATION_SYSTEM'
  | 'NODE_VERSION_DEPRECATION_BUNDLED'
  | 'PLUGINS_FILE_CONFIG_OPTION_REMOVED'
  | 'RENAMED_CONFIG_OPTION'
  | 'TEST_FILES_RENAMED'

const TESTING_TYPES = ['e2e', 'component'] as const

type TestingType = typeof TESTING_TYPES[number]

export interface ConfigOption {
  name: string
  defaultValue?: any
  validation: Function
  isFolder?: boolean
  isExperimental?: boolean
  /**
   * The list of overrides levels supported by the configuration option. When undefined,
   * it indicates the configuration value cannot be override via suite-/test-specific
   * overrides or at test-time with Cypress.Config().
   */
  overrideLevels?: Array< 'suite' | 'test' | 'testTime'>
  // option is a test-type specific option that can be set at the root level
  allowSettingOnRoot?: boolean
  requireRestartOnChange?: 'server' | 'browser'
}

export interface RuntimeConfigOption {
  name: string
  defaultValue: any
  validation: Function
  isInternal?: boolean
  /**
   * The list of overrides levels supported by the configuration option. When undefined,
   * it indicates the configuration value cannot be override via suite-/test-specific
   * overrides or at test-time with Cypress.Config().
   */
  overrideLevels?: Array<'suite' | 'test' | 'testTime'>
  requireRestartOnChange?: 'server' | 'browser'
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
  /**
    * Whether to show the error message in the launchpad
    */
  showInLaunchpad?: boolean
}

export const getTestingTypeConfigOptions = (testingType: string) => {
  return [
    ...runtimeConfigOptions,
    ...rootConfigOptions,
    ...testingTypeConfigOptions,
    ...getTestingTypeSpecificConfigOptions(testingType),
  ]
}

const getTestingTypeSpecificConfigOptions = (testingType: string) => {
  return testingType === 'component' ? componentSpecificConfigOptions : e2eSpecificConfigOptions
}

export const isValidTestingTypeConfig = (testingType: string, config: any): ErrResult | true => {
  const result = validate.isPlainObject(testingType, config)

  if (result !== true) {
    return result
  }

  const allOpts = [
    ...rootConfigOptions,
    ...testingTypeConfigOptions,
    ...getTestingTypeSpecificConfigOptions(testingType),
  ]

  for (const rule of allOpts) {
    if (rule.name in config && rule.validation) {
      const status = rule.validation(`${testingType}.${rule.name}`, config[rule.name])

      if (status !== true) {
        return status
      }
    }
  }

  return true
}

export const defaultSpecPattern = {
  e2e: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  component: '**/*.cy.{js,jsx,ts,tsx}',
}

const testingTypeConfigOptions: Array<ConfigOption> = [
  {
    name: 'excludeSpecPattern',
    validation: validate.isStringOrArrayOfStrings,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'slowTestThreshold',
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'specPattern',
    validation: validate.isStringOrArrayOfStrings,
    requireRestartOnChange: 'server',
  }, {
    name: 'supportFile',
    validation: validate.isStringOrFalse,
    requireRestartOnChange: 'server',
  }, {
    name: 'viewportHeight',
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
    allowSettingOnRoot: true,
  }, {
    name: 'viewportWidth',
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
    allowSettingOnRoot: true,
  },
]

const e2eSpecificConfigOptions: Array<ConfigOption> = [
  {
    name: 'baseUrl',
    validation: validate.isFullyQualifiedUrl,
    overrideLevels: ['suite', 'test', 'testTime'],
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSessionAndOrigin',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'testIsolation',
    validation: validate.isBoolean,
    overrideLevels: ['suite'],
    isExperimental: true,
  },
]

const componentSpecificConfigOptions: Array<ConfigOption> = [
  {
    name: 'indexHtmlFile',
    validation: validate.isString,
  },
  // TODO: add validation around this configuration option
  // {
  //   name: 'devServer',
  // },
]

// NOTE:
// If you add/remove/change a config value, make sure to update the following
// - cli/types/index.d.ts (including allowed config options on TestOptions)
//
// Add options in alphabetical order for better readability

// TODO - add boolean attribute to indicate read-only / static vs mutable options
// that can be updated during test executions
const rootConfigOptions: Array<ConfigOption> = [
  {
    name: 'animationDistanceThreshold',
    defaultValue: 5,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'arch',
    defaultValue: () => os.arch(),
    validation: validate.isString,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: validate.isFullyQualifiedUrl,
    overrideLevels: ['suite', 'test', 'testTime'],
    requireRestartOnChange: 'server',
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: validate.isStringOrArrayOfStrings,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    validation: validate.isBoolean,
    requireRestartOnChange: 'browser',
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: validate.isValidClientCertificatesSet,
    requireRestartOnChange: 'server',
  }, {
    name: 'component',
    // component testing specific configuration values
    defaultValue: {
      additionalIgnorePattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      excludeSpecPattern: [
        '**/__snapshots__/*',
        '**/__image_snapshots__/*',
      ],
      indexHtmlFile: 'cypress/support/component-index.html',
      slowTestThreshold: 250,
      specPattern: '**/*.cy.{js,jsx,ts,tsx}',
      supportFile: 'cypress/support/component.{js,jsx,ts,tsx}',
      viewportHeight: 500,
      viewportWidth: 500,
    },
    validation: isValidTestingTypeConfig,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: validate.isString,
    isFolder: true,
    requireRestartOnChange: 'browser',
  }, {
    name: 'e2e',
    // e2e testing specific configuration values
    defaultValue: {
      additionalIgnorePattern: [],
      baseUrl: null,
      excludeSpecPattern: '*.hot-update.js',
      slowTestThreshold: 10000,
      specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      supportFile: 'cypress/support/e2e.{js,jsx,ts,tsx}',
      testIsolation: false,
      viewportHeight: 660,
      viewportWidth: 1000,
    },
    validation: isValidTestingTypeConfig,
  }, {
    name: 'env',
    defaultValue: {},
    validation: validate.isPlainObject,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSessionAndOrigin',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalModifyObstructiveThirdPartyCode',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: validate.isString,
    isFolder: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: validate.isStringOrFalse,
    isFolder: true,
    requireRestartOnChange: 'server',
  },
  // {
  //   name: 'excludeSpecPattern',
  //   defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? ['**/__snapshots__/*', '**/__image_snapshots__/*'] : '*.hot-update.js',
  //   validation: validate.isStringOrArrayOfStrings,
  //   overrideLevels: ['suite', 'test', 'testTime'],
  // },
  {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: validate.isBoolean,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'keystrokeDelay',
    defaultValue: 0,
    validation: validate.isNumberOrFalse,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
    requireRestartOnChange: 'server',
  }, {
    name: 'nodeVersion',
    validation: validate.isOneOf('bundled', 'system'),
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'platform',
    defaultValue: () => os.platform(),
    validation: validate.isString,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'port',
    defaultValue: null,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'projectId',
    defaultValue: null,
    validation: validate.isString,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: validate.isString,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: validate.isPlainObject,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'resolvedNodePath',
    defaultValue: null,
    validation: validate.isString,
  }, {
    name: 'resolvedNodeVersion',
    defaultValue: null,
    validation: validate.isString,
  }, {
    name: 'responseTimeout',
    defaultValue: 30000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    validation: validate.isValidRetriesConfig,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: validate.isBoolean,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: validate.isStringOrFalse,
    isFolder: true,
    requireRestartOnChange: 'server',
  },
  // {
  //   name: 'slowTestThreshold',
  //   defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
  //   validation: validate.isNumber,
  //   overrideLevels: ['suite', 'test', 'testTime'],
  // },
  {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
    overrideLevels: ['suite', 'test', 'testTime'],
  },
  // {
  //   name: 'supportFile',
  //   defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 'cypress/support/component.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
  //   validation: validate.isStringOrFalse,
  //   requireRestartOnChange: 'server',
  // },
  {
    name: 'supportFolder', // deprecated / removed in 10.x
    defaultValue: false,
    validation: validate.isStringOrFalse,
    isFolder: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'userAgent',
    defaultValue: null,
    validation: validate.isString,
    requireRestartOnChange: 'browser',
  }, {
    name: 'video',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'videoCompression',
    defaultValue: 32,
    validation: validate.isNumberOrFalse,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    validation: validate.isString,
    isFolder: true,
  }, {
    name: 'videoUploadOnPasses',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'viewportHeight',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 660,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'viewportWidth',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 1000,
    validation: validate.isNumber,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validate.isBoolean,
    overrideLevels: ['suite', 'test', 'testTime'],
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validate.isBoolean,
    requireRestartOnChange: 'server',
  },
  // // Possibly add a defaultValue for specPattern https://github.com/cypress-io/cypress/issues/22507
  // {
  //   name: 'specPattern',
  //   validation: validate.isStringOrArrayOfStrings,
  // },
]

const runtimeConfigOptions: Array<RuntimeConfigOption> = [
  // {
  //   // Internal config field, useful to ignore the e2e specPattern set by the user
  //   // or the default one when looking fot CT, it needs to be a config property because after
  //   // having the final config that has the e2e property flattened/compacted
  //   // we may not be able to get the value to ignore.
  //   name: 'additionalIgnorePattern',
  //   defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? defaultSpecPattern.e2e : [],
  //   validation: validate.isStringOrArrayOfStrings,
  //   isInternal: true,
  // },
  {
    name: 'autoOpen',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
  }, {
    name: 'browsers',
    defaultValue: [],
    validation: validate.isValidBrowserList,
  }, {
    name: 'clientRoute',
    defaultValue: '/__/',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'configFile',
    defaultValue: 'cypress.config.js',
    validation: validate.isString,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
    isInternal: true,
  }, {
    name: 'cypressBinaryRoot',
    defaultValue: path.join(__dirname, '..', '..', '..'),
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'devServerPublicPathRoute',
    defaultValue: '/__cypress/src',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'hosts',
    defaultValue: null,
    validation: validate.isPlainObject,
  }, {
    name: 'isInteractive',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'isTextTerminal',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
  }, {
    name: 'morgan',
    defaultValue: true,
    validation: validate.isBoolean,
    isInternal: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'namespace',
    defaultValue: '__cypress',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'reporterRoute',
    defaultValue: '/__cypress/reporter',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'socketId',
    defaultValue: null,
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'socketIoCookie',
    defaultValue: '__socket',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'version',
    defaultValue: pkg.version,
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: validate.isString,
    isInternal: true,
  },
]

export const options: Array<ConfigOption | RuntimeConfigOption> = [
  ...rootConfigOptions,
  ...runtimeConfigOptions,
]

export const getInvalidRootOptions = (): Array<BreakingOption> => {
  const invalidTestingTypeOptsOnRoot = TESTING_TYPES.map((type) => {
    return getTestingTypeSpecificConfigOptions(type).map((opt) => {
      return {
        name: opt.name,
        testingTypes: [type],
        errorKey: `CONFIG_FILE_INVALID_ROOT_CONFIG_${type.toUpperCase()}`,
        isWarning: false,
      } as BreakingOption
    })
  }).reduce((prev, curr) => prev.concat(curr))

  return testingTypeConfigOptions.map((opt) => {
    if (opt?.allowSettingOnRoot) {
      return {
        name: opt.name,
        errorKey: 'CONFIG_FILE_AVOID_ROOT_CONFIG',
        isWarning: true,
      } as BreakingOption
    }

    return {
      ...opt,
      errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
      testingTypes: TESTING_TYPES,
      isWarning: false,
    } as BreakingOption
  }).concat(invalidTestingTypeOptsOnRoot)
}

export const getInvalidTestingTypeOptions = (testingType: TestingType, checkingRootConfig: boolean = false): Array<BreakingOption> => {
  // return TestingTypes.filter((type) => type !== testingType)
  // .map((type) => {
  //   return getTestingTypeConfigOptions(testingType as TestingType).map((opt) => {
  //     return {
  //       name: opt.name,
  //       errorKey: `CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_${type.toUpperCase()}`,
  //       isWarning: false,
  //       testingType,
  //     } as BreakingOption
  //   })
  // }).reduce((prev, curr) => prev.concat(curr))

  // validate the wrong test-specific options aren't on the testing-specific level
  const errorKey = `CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_${testingType.toUpperCase()}`
  const invalidTestingTypeOptions = testingType === 'component' ? e2eSpecificConfigOptions : componentSpecificConfigOptions

  return invalidTestingTypeOptions.map((opt) => {
    return {
      name: opt.name,
      errorKey,
      isWarning: false,
    } as BreakingOption
  })
}

/**
 * Values not allowed in 10.X+ in the root, e2e and component config
 */
export const breakingOptions: Array<BreakingOption> = [
  {
    name: 'blacklistHosts',
    errorKey: 'RENAMED_CONFIG_OPTION',
    newName: 'blockHosts',
    isWarning: false,
  }, {
    name: 'componentFolder',
    errorKey: 'COMPONENT_FOLDER_REMOVED',
    isWarning: false,
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
    name: 'experimentalSessionSupport',
    errorKey: 'EXPERIMENTAL_SESSION_SUPPORT_REMOVED',
    isWarning: true,
  }, {
    name: 'experimentalShadowDomSupport',
    errorKey: 'EXPERIMENTAL_SHADOW_DOM_REMOVED',
    isWarning: true,
  }, {
    name: 'experimentalStudio',
    errorKey: 'EXPERIMENTAL_STUDIO_REMOVED',
    isWarning: true,
    showInLaunchpad: true,
  }, {
    name: 'firefoxGcInterval',
    errorKey: 'FIREFOX_GC_INTERVAL_REMOVED',
    isWarning: true,
  }, {
    name: 'ignoreTestFiles',
    errorKey: 'TEST_FILES_RENAMED',
    newName: 'excludeSpecPattern',
    isWarning: false,
  }, {
    name: 'integrationFolder',
    errorKey: 'INTEGRATION_FOLDER_REMOVED',
    isWarning: false,
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
  }, {
    name: 'pluginsFile',
    errorKey: 'PLUGINS_FILE_CONFIG_OPTION_REMOVED',
    isWarning: false,
  }, {
    name: 'testFiles',
    errorKey: 'TEST_FILES_RENAMED',
    newName: 'specPattern',
    isWarning: false,
  },
]

export const breakingRootOptions: Array<BreakingOption> = [
  {
    name: 'baseUrl',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
    isWarning: false,
    testingTypes: ['e2e'],
  }, {
    name: 'experimentalSessionAndOrigin',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
    isWarning: false,
    testingTypes: ['e2e'],
  }, {
    name: 'excludeSpecPattern',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  }, {
    name: 'experimentalStudio',
    errorKey: 'EXPERIMENTAL_STUDIO_REMOVED',
    isWarning: true,
    testingTypes: ['component', 'e2e'],
  }, {
    name: 'indexHtmlFile',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT',
    isWarning: false,
    testingTypes: ['component'],
  }, {
    name: 'slowTestThreshold',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  }, {
    name: 'specPattern',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  }, {
    name: 'supportFile',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  },
]

export const testingTypeBreakingOptions: { e2e: Array<BreakingOption>, component: Array<BreakingOption> } = {
  e2e: [
    {
      name: 'indexHtmlFile',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E',
      isWarning: false,
    },
  ],
  component: [
    {
      name: 'baseUrl',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT',
      isWarning: false,
    },
    {
      name: 'experimentalSessionAndOrigin',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT',
      isWarning: false,
    },
  ],
}
