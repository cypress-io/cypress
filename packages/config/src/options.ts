import os from 'os'
import path from 'path'

// @ts-ignore
import pkg from '@packages/root'
import type { AllCypressErrorNames } from '@packages/errors'
import type { TestingType } from '@packages/types'

import * as validate from './validation'

const BREAKING_OPTION_ERROR_KEY: Readonly<AllCypressErrorNames[]> = [
  'COMPONENT_FOLDER_REMOVED',
  'INTEGRATION_FOLDER_REMOVED',
  'CONFIG_FILE_INVALID_ROOT_CONFIG',
  'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
  'CONFIG_FILE_INVALID_ROOT_CONFIG_COMPONENT',
  'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT',
  'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E',
  'EXPERIMENTAL_COMPONENT_TESTING_REMOVED',
  'EXPERIMENTAL_JIT_COMPILE_REMOVED',
  'EXPERIMENTAL_SAMESITE_REMOVED',
  'EXPERIMENTAL_NETWORK_STUBBING_REMOVED',
  'EXPERIMENTAL_RUN_EVENTS_REMOVED',
  'EXPERIMENTAL_SESSION_SUPPORT_REMOVED',
  'EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED',
  'EXPERIMENTAL_SINGLE_TAB_RUN_MODE',
  'EXPERIMENTAL_SHADOW_DOM_REMOVED',
  'FIREFOX_GC_INTERVAL_REMOVED',
  'PLUGINS_FILE_CONFIG_OPTION_REMOVED',
  'VIDEO_UPLOAD_ON_PASSES_REMOVED',
  'RENAMED_CONFIG_OPTION',
  'TEST_FILES_RENAMED',
] as const

type ValidationOptions = {
  testingType: TestingType | null
}

export type BreakingOptionErrorKey = typeof BREAKING_OPTION_ERROR_KEY[number]

export type OverrideLevel = 'any' | 'suite' | 'never'

interface ConfigOption {
  name: string
  defaultValue?: any
  validation: Function
  requireRestartOnChange?: 'server' | 'browser'
  /**
   * The list of test-time overrides levels supported by the configuration option. When undefined,
   * it indicates the configuration value cannot be overridden via suite-/test-specific
   * overrides or at run-time with Cypress.Config().
   */
  overrideLevel?: OverrideLevel
}

interface DriverConfigOption extends ConfigOption {
  isFolder?: boolean
  isExperimental?: boolean
}

// Cypress run-time options
interface RuntimeConfigOption extends ConfigOption {
  defaultValue: any
  isInternal?: boolean
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

const isValidConfig = (testingType: string, config: any, opts: ValidationOptions) => {
  const status = validate.isPlainObject(testingType, config)

  if (status !== true) {
    return status
  }

  for (const rule of options) {
    if (rule.name in config && rule.validation) {
      const status = rule.validation(`${testingType}.${rule.name}`, config[rule.name], opts)

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

export const defaultExcludeSpecPattern = {
  e2e: '*.hot-update.js',
  component: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
}

// NOTE:
// If you add/remove/change a config value, make sure to update the following
// - cli/types/index.d.ts (including allowed config options on TestOptions)
//
// Add options in alphabetical order for better readability
const driverConfigOptions: Array<DriverConfigOption> = [
  {
    name: 'animationDistanceThreshold',
    defaultValue: 5,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'arch',
    defaultValue: () => os.arch(),
    validation: validate.isString,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: validate.isFullyQualifiedUrl,
    overrideLevel: 'any',
    requireRestartOnChange: 'server',
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: validate.isStringOrArrayOfStrings,
    overrideLevel: 'any',
    requireRestartOnChange: 'server',
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
    // runner-ct overrides
    defaultValue: {
      specPattern: defaultSpecPattern.component,
      indexHtmlFile: 'cypress/support/component-index.html',
    },
    validation: isValidConfig,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: validate.isString,
    isFolder: true,
    requireRestartOnChange: 'browser',
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {
      specPattern: defaultSpecPattern.e2e,
    },
    validation: isValidConfig,
  }, {
    name: 'env',
    defaultValue: {},
    validation: validate.isPlainObject,
    overrideLevel: 'any',
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'experimentalCspAllowList',
    defaultValue: false,
    validation: validate.validateAny(validate.isBoolean, validate.isArrayIncludingAny('script-src-elem', 'script-src', 'default-src', 'form-action', 'child-src', 'frame-src')),
    overrideLevel: 'never',
    requireRestartOnChange: 'server',
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
    name: 'experimentalRunAllSpecs',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalMemoryManagement',
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
    name: 'experimentalSkipDomainInjection',
    defaultValue: null,
    validation: validate.isNullOrArrayOfStrings,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'justInTimeCompile',
    defaultValue: true,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalOriginDependencies',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    overrideLevel: 'any',
    requireRestartOnChange: 'browser',
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalSingleTabRunMode',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'experimentalStudio',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
    requireRestartOnChange: 'browser',
  }, {
    name: 'experimentalWebKitSupport',
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
  }, {
    name: 'excludeSpecPattern',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? defaultExcludeSpecPattern.component : defaultExcludeSpecPattern.e2e,
    validation: validate.isStringOrArrayOfStrings,
    overrideLevel: 'any',
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: validate.isBoolean,
    overrideLevel: 'any',
  }, {
    name: 'keystrokeDelay',
    defaultValue: 0,
    validation: validate.isNumberOrFalse,
    overrideLevel: 'any',
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
    requireRestartOnChange: 'server',
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'platform',
    defaultValue: () => os.platform(),
    validation: validate.isString,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'port',
    defaultValue: null,
    validation: validate.isNumber,
  }, {
    name: 'projectId',
    defaultValue: null,
    validation: validate.isString,
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: validate.isString,
    overrideLevel: 'any',
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: validate.isPlainObject,
    overrideLevel: 'any',
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: validate.isNumber,
    overrideLevel: 'any',
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
    overrideLevel: 'any',
  }, {
    /**
     * if experimentalStrategy is `detect-flake-and-pass-on-threshold`
     * an no experimentalOptions are configured, the following configuration
     * should be implicitly used:
     * experimentalStrategy: 'detect-flake-and-pass-on-threshold',
     * experimentalOptions: {
     *   maxRetries: 2,
     *   passesRequired: 2
     * }
     *
     * if experimentalStrategy is `detect-flake-but-always-fail`
     * an no experimentalOptions are configured, the following configuration
     * should be implicitly used:
     * experimentalStrategy: 'detect-flake-but-always-fail',
     * experimentalOptions: {
     *   maxRetries: 2,
     *   stopIfAnyPassed: false
     * }
     */
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
      // these values MUST be populated in order to display the experiment correctly inside the project settings in open mode
      experimentalStrategy: undefined,
      experimentalOptions: undefined,
    },
    validation: validate.isValidRetriesConfig,
    overrideLevel: 'any',
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: validate.isBoolean,
    overrideLevel: 'any',
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: validate.isStringOrFalse,
    isFolder: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'slowTestThreshold',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
    overrideLevel: 'any',
  }, {
    name: 'supportFile',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 'cypress/support/component.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
    validation: validate.isStringOrFalse,
    requireRestartOnChange: 'server',
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: validate.isStringOrFalse,
    isFolder: true,
    requireRestartOnChange: 'server',
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'testIsolation',
    defaultValue: true,
    validation: (key: string, value: any, opts: ValidationOptions) => {
      const { testingType } = opts

      let configOpts = [true, false]

      if (testingType === 'component') {
        configOpts.pop()
      }

      return validate.isOneOf(...configOpts)(key, value)
    },
    overrideLevel: 'suite',
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
    defaultValue: false,
    validation: validate.isBoolean,
  }, {
    name: 'videoCompression',
    defaultValue: false,
    validation: validate.isValidCrfOrBoolean,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    validation: validate.isString,
    isFolder: true,
  }, {
    name: 'viewportHeight',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 660,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'viewportWidth',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 1000,
    validation: validate.isNumber,
    overrideLevel: 'any',
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validate.isBoolean,
    overrideLevel: 'any',
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validate.isBoolean,
    requireRestartOnChange: 'server',
  },
  {
    name: 'specPattern',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? defaultSpecPattern.component : defaultSpecPattern.e2e,
    validation: validate.isStringOrArrayOfStrings,
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    // Internal config field, useful to ignore the e2e specPattern set by the user
    // or the default one when looking fot CT, it needs to be a config property because after
    // having the final config that has the e2e property flattened/compacted
    // we may not be able to get the value to ignore.
    name: 'additionalIgnorePattern',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? defaultSpecPattern.e2e : [],
    validation: validate.isStringOrArrayOfStrings,
    isInternal: true,
  }, {
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
    // ct-testing specific configuration
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
    name: 'repoRoot',
    defaultValue: null,
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
    name: 'protocolEnabled',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
  }, {
    name: 'hideCommandLog',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
  },
  {
    name: 'hideRunnerUi',
    defaultValue: false,
    validation: validate.isBoolean,
    isInternal: true,
  },
]

export const options: Array<DriverConfigOption | RuntimeConfigOption> = [
  ...driverConfigOptions,
  ...runtimeOptions,
]

/**
 * Values not allowed in 10.X+ in the root, e2e and component config
 */
export const breakingOptions: Readonly<BreakingOption[]> = [
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
    name: 'experimentalJustInTimeCompile',
    errorKey: 'EXPERIMENTAL_JIT_COMPILE_REMOVED',
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
    name: 'experimentalSessionAndOrigin',
    errorKey: 'EXPERIMENTAL_SESSION_AND_ORIGIN_REMOVED',
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
    name: 'ignoreTestFiles',
    errorKey: 'TEST_FILES_RENAMED',
    newName: 'excludeSpecPattern',
    isWarning: false,
  }, {
    name: 'integrationFolder',
    errorKey: 'INTEGRATION_FOLDER_REMOVED',
    isWarning: false,
  }, {
    name: 'pluginsFile',
    errorKey: 'PLUGINS_FILE_CONFIG_OPTION_REMOVED',
    isWarning: false,
  },
  {
    name: 'testFiles',
    errorKey: 'TEST_FILES_RENAMED',
    newName: 'specPattern',
    isWarning: false,
  }, {
    name: 'videoUploadOnPasses',
    errorKey: 'VIDEO_UPLOAD_ON_PASSES_REMOVED',
    isWarning: true,
  },
] as const

export const breakingRootOptions: Array<BreakingOption> = [
  {
    name: 'baseUrl',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
    isWarning: false,
    testingTypes: ['e2e'],
  }, {
    name: 'excludeSpecPattern',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
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
  }, {
    name: 'testIsolation',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['e2e'],
  }, {
    name: 'experimentalRunAllSpecs',
    errorKey: 'EXPERIMENTAL_RUN_ALL_SPECS_E2E_ONLY',
    isWarning: false,
    testingTypes: ['e2e'],
  },
  {
    name: 'experimentalOriginDependencies',
    errorKey: 'EXPERIMENTAL_ORIGIN_DEPENDENCIES_E2E_ONLY',
    isWarning: false,
    testingTypes: ['e2e'],
  },
  {
    name: 'experimentalSkipDomainInjection',
    errorKey: 'EXPERIMENTAL_USE_DEFAULT_DOCUMENT_DOMAIN_E2E_ONLY',
    isWarning: false,
    testingTypes: ['e2e'],
  },
  {
    name: 'justInTimeCompile',
    errorKey: 'JIT_COMPONENT_TESTING',
    isWarning: false,
    testingTypes: ['component'],
  },
]

export const testingTypeBreakingOptions: { e2e: Array<BreakingOption>, component: Array<BreakingOption> } = {
  e2e: [
    {
      name: 'experimentalSingleTabRunMode',
      errorKey: 'EXPERIMENTAL_SINGLE_TAB_RUN_MODE',
      isWarning: false,
    },
    {
      name: 'indexHtmlFile',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E',
      isWarning: false,
    },
    {
      name: 'justInTimeCompile',
      errorKey: 'JIT_COMPONENT_TESTING',
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
      name: 'experimentalStudio',
      errorKey: 'EXPERIMENTAL_STUDIO_E2E_ONLY',
      isWarning: false,
    },
    {
      name: 'testIsolation',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_COMPONENT',
      isWarning: false,
    },
    {
      name: 'experimentalRunAllSpecs',
      errorKey: 'EXPERIMENTAL_RUN_ALL_SPECS_E2E_ONLY',
      isWarning: false,
    },
    {
      name: 'experimentalOriginDependencies',
      errorKey: 'EXPERIMENTAL_ORIGIN_DEPENDENCIES_E2E_ONLY',
      isWarning: false,
    },
    {
      name: 'experimentalSkipDomainInjection',
      errorKey: 'EXPERIMENTAL_USE_DEFAULT_DOCUMENT_DOMAIN_E2E_ONLY',
      isWarning: false,
    },
  ],
}
