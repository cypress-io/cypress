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
  | 'NODE_VERSION_DEPRECATION_SYSTEM'
  | 'NODE_VERSION_DEPRECATION_BUNDLED'
  | 'PLUGINS_FILE_CONFIG_OPTION_REMOVED'
  | 'RENAMED_CONFIG_OPTION'
  | 'TEST_FILES_RENAMED'

type TestingType = 'e2e' | 'component'
const TestingTypes = ['e2e', 'component']

interface ConfigOption {
  name: string
  defaultValue?: any
  validation: Function
  isFolder?: boolean
  isExperimental?: boolean
  /**
   * Can be mutated with Cypress.config() or test-specific configuration overrides
   */
  canUpdateDuringTestTime?: boolean
  // option is a test-type specific option that can be set at the root level
  allowSettingOnRoot?: boolean
  requireRestartOnChange?: 'server' | 'browser'
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
  return testingType === 'component' ? componentSpecificConfigOptions : e2eSpecificConfigOptions
}

export const isValidTestingTypeConfig = (key: string, value: any): ErrResult | true => {
  const result = validate.isPlainObject(key, value)

  if (result !== true) {
    return result
  }

  const allOpts = [
    ...rootConfigOptions,
    ...testingTypeConfigOptions,
    ...getTestingTypeConfigOptions(key),
  ]

  for (const rule of allOpts) {
    if (rule.name in value && rule.validation) {
      const status = rule.validation(`${key}.${rule.name}`, value[rule.name])

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
    canUpdateDuringTestTime: true,
  }, {
    name: 'slowTestThreshold',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'specPattern',
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  }, {
    name: 'supportFile',
    validation: validate.isStringOrFalse,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  }, {
    name: 'viewportHeight',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
    allowSettingOnRoot: true,
  }, {
    name: 'viewportWidth',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
    allowSettingOnRoot: true,
  },
]

const e2eSpecificConfigOptions: Array<ConfigOption> = [
  {
    name: 'baseUrl',
    validation: validate.isFullyQualifiedUrl,
    canUpdateDuringTestTime: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSessionAndOrigin',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'testIsolation',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
    isExperimental: true,
  },
]

const componentSpecificConfigOptions: Array<ConfigOption> = [
  {
    name: 'indexHtmlFile',
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  },
  // TODO: add validation around this configuration option
  // {
  //   name: 'devServer',
  //   canUpdateDuringTestTime: false,
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
    requireRestartOnChange: 'server',
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
    requireRestartOnChange: 'browser',
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: validate.isValidClientCertificatesSet,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  }, {
    name: 'component',
    // component testing specific configuration values
    defaultValue: {
      additionalIgnorePattern: defaultSpecPattern.e2e,
      excludeSpecPattern: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
      indexHtmlFile: 'cypress/support/component-index.html',
      slowTestThreshold: 250,
      specPattern: defaultSpecPattern.component,
      supportFile: 'cypress/support/component.{js,jsx,ts,tsx}',
      viewportHeight: 500,
      viewportWidth: 500,
    },
    validation: isValidTestingTypeConfig,
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
    requireRestartOnChange: 'browser',
  }, {
    name: 'e2e',
    // e2e testing specific configuration values
    defaultValue: {
      baseUrl: null,
      excludeSpecPattern: '*.hot-update.js',
      slowTestThreshold: 10000,
      specPattern: defaultSpecPattern.e2e,
      supportFile: 'cypress/support/e2e.{js,jsx,ts,tsx}',
      testIsolation: false,
      viewportHeight: 660,
      viewportWidth: 1000,
    },
    validation: isValidTestingTypeConfig,
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
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSessionAndOrigin',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: validate.isString,
    isFolder: true,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
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
    requireRestartOnChange: 'server',
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
    requireRestartOnChange: 'server',
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
    canUpdateDuringTestTime: true,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: validate.isStringOrFalse,
    isFolder: true,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
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
    requireRestartOnChange: 'browser',
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
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
    requireRestartOnChange: 'server',
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    // Internal config field, useful to ignore the e2e specPattern set by the user
    // or the default one when looking fot CT, it needs to be a config property because after
    // having the final config that has the e2e property flattened/compacted
    // we may not be able to get the value to ignore.
    name: 'additionalIgnorePattern',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? defaultSpecPattern.e2e : undefined,
    validation: validate.isString,
    isInternal: true,
    canUpdateDuringTestTime: false,
  }, {
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
    validation: validate.isString,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
    isInternal: true,
    canUpdateDuringTestTime: false,
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

export const options: Array<ConfigOption | RuntimeConfigOption> = [
  ...rootConfigOptions,
  ...runtimeOptions,
  ...testingTypeConfigOptions,
]

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

export const getInvalidRootOptions = (): Array<BreakingOption> => {
  const invalidTestingTypeOptsOnRoot = TestingTypes.map((type) => {
    return getTestingTypeConfigOptions(type).map((opt) => {
      return {
        name: opt.name,
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
      isWarning: false,
    } as BreakingOption
  }).concat(invalidTestingTypeOptsOnRoot)

  // .concat(getTestingTypeConfigOptions('e2e').map((opt) => {
  //   return {
  //     name: opt.name,
  //     errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
  //     isWarning: false,
  //   } as BreakingOption
  // }))
  // .concat(getTestingTypeConfigOptions('component').map((opt) => {
  //   return {
  //     name: opt.name,
  //     errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT',
  //     isWarning: false,
  //   } as BreakingOption
  // }))
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

// export const getInvalidTestingTypeOptions = (testingType: TestingType, checkingRootConfig: boolean = false): Array<BreakingOption> => {
//   if (checkingRootConfig) {
//     const errorKey = `CONFIG_FILE_INVALID_ROOT_CONFIG_${testingType.toUpperCase()}`
//     const testingTypeOptions = testingType === 'component' ? componentSpecificConfigOptions : e2eSpecificConfigOptions

//     return testingTypeOptions.map((opt) => {
//       return {
//         name: opt.name,
//         errorKey,
//         isWarning: false,
//       } as BreakingOption
//     })
//   }

//   const errorKey = `CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_${testingType.toUpperCase()}`
//   const invalidTestingTypeOptions = testingType === 'component' ? e2eSpecificConfigOptions : componentSpecificConfigOptions

//   return invalidTestingTypeOptions.map((opt) => {
//     return {
//       name: opt.name,
//       errorKey,
//       isWarning: false,
//     } as BreakingOption
//   })
// }
