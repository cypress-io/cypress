import validate from './validation'

type DefaultValue = string | boolean | Record<string, any> | number | null | undefined

type TestingType = 'component' | 'e2e'

/**
 * Validates the configuration shape for a given testing type
 */
function isValidConfig (configType: TestingType, key: string, config: any): true | string {
  const options = configType === 'component' ? componentOptions : e2eOptions

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

export interface ResolvedConfigOption {
  name: string
  defaultValue: DefaultValue
  validation: (key: any, value: any) => true | string // If it' a string, it's a validation error. Otherwise
  isFolder?: boolean
  isExperimental?: boolean
}

// NOTE:
// If you add/remove/change a config value, make sure to update the following
// - cli/types/index.d.ts (including allowed config options on TestOptions)
// - cypress.schema.json
//
// Add options in alphabetical order for better readability

// TODO - add boolean attribute to indicate read-only / static vs mutable options
// that can be updated during test executions
export const resolvedOptions = [
  {
    name: 'animationDistanceThreshold',
    defaultValue: 5,
    validation: validate.isNumber,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: validate.isFullyQualifiedUrl,
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: validate.isStringOrArrayOfStrings,
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: validate.isValidClientCertificatesSet,
  }, {
    name: 'component',
    // runner-ct overrides
    defaultValue: {},
    validation: isValidConfig.bind(null, 'component'),
  }, {
    name: 'componentFolder',
    defaultValue: 'cypress/component',
    validation: validate.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: validate.isNumber,
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: validate.isString,
    isFolder: true,
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {},
    validation: isValidConfig.bind(null, 'e2e'),
  }, {
    name: 'env',
    defaultValue: {},
    validation: validate.isPlainObject,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: validate.isString,
    isFolder: true,
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: validate.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'ignoreTestFiles',
    defaultValue: '*.hot-update.js',
    validation: validate.isStringOrArrayOfStrings,
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: validate.isBoolean,
  }, {
    name: 'integrationFolder',
    defaultValue: 'cypress/integration',
    validation: validate.isString,
    isFolder: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'nodeVersion',
    validation: validate.isOneOf('bundled', 'system'),
    defaultValue: undefined,
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validate.isNumber,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
  }, {
  //   name: 'pluginsFile',
  //   defaultValue: 'cypress/plugins',
  //   validation: validate.isStringOrFalse,
  //   isFolder: true,
  // }, {
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
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: validate.isString,
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: validate.isPlainObject,
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: validate.isNumber,
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
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    validation: validate.isValidRetriesConfig,
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: validate.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
  }, {
    name: 'supportFile',
    defaultValue: 'cypress/support',
    validation: validate.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: validate.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
  }, {
    name: 'testFiles',
    defaultValue: '**/*.*',
    validation: validate.isStringOrArrayOfStrings,
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'userAgent',
    defaultValue: null,
    validation: validate.isString,
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
    defaultValue: 660,
    validation: validate.isNumber,
  }, {
    name: 'viewportWidth',
    defaultValue: 1000,
    validation: validate.isNumber,
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validate.isBoolean,
  },
] as const

export const resolvedOptionsComponent = [
  ...resolvedOptions,
  {
    name: 'slowTestThreshold',
    defaultValue: 250,
    validation: validate.isNumber,
  },
]

export const resolvedOptionsE2E = [
  ...resolvedOptions,
  {
    name: 'slowTestThreshold',
    defaultValue: 10000,
    validation: validate.isNumber,
  },
]

export const experimentalOptions = [
  {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSessionSupport',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalStudio',
    defaultValue: false,
    validation: validate.isBoolean,
    isExperimental: true,
  },
]

export type RuntimeOrResolvedOption = RuntimeConfigOption | ResolvedConfigOption

// Used to ensure that the above is valid, without losing the ability to index the shape on `name`
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkTsResolvedOptions: ReadonlyArray<ResolvedConfigOption> = resolvedOptions

export interface RuntimeConfigOption {
  name: string
  defaultValue: any
  // If it' a string, it's a validation error
  validation: (key: any, value: any) => true | string
}

export const internalRuntimeOptions = [
  // TODO(tim): This is not even used
  {
    name: 'autoOpen',
    defaultValue: false,
    validation: validate.isBoolean,
  }, {
    name: 'clientRoute',
    defaultValue: '/__/',
    validation: validate.isString,
  }, {
    name: 'configFile',
    defaultValue: 'cypress.config.js',
    validation: validate.isStringOrFalse,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
  }, {
    name: 'devServerPublicPathRoute',
    defaultValue: '/__cypress/src',
    validation: validate.isString,
  }, {
    name: 'isTextTerminal',
    defaultValue: false,
    validation: validate.isBoolean,
  }, {
    name: 'morgan',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validate.isBoolean,
  }, {
    name: 'namespace',
    defaultValue: '__cypress',
    validation: validate.isString,
  }, {
    name: 'reporterRoute',
    defaultValue: '/__cypress/reporter',
    validation: validate.isString,
  }, {
    name: 'socketId',
    defaultValue: null,
    validation: validate.isString,
  }, {
    name: 'socketIoCookie',
    defaultValue: '__socket.io',
    validation: validate.isString,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket.io',
    validation: validate.isString,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: validate.isString,
  },
]

export const runtimeOptions = [
  {
    name: 'browsers',
    defaultValue: [],
    validation: validate.isValidBrowserList,
  }, {
    name: 'hosts',
    defaultValue: null,
    validation: validate.isPlainObject,
  },
  ...internalRuntimeOptions,
] as const

// Used to ensure that the above is valid, without losing the ability to index the shape on `name`
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkTsRuntimeOptions: ReadonlyArray<RuntimeConfigOption> = runtimeOptions

export const options = [
  ...resolvedOptions,
  ...runtimeOptions,
] as const

export const allConfigOptions = options

export const componentOptions = [
  ...resolvedOptionsComponent,
  ...runtimeOptions,
]

export const e2eOptions = [
  ...resolvedOptionsE2E,
  ...runtimeOptions,
]

export interface BreakingOption {
  /**
   * The non-passive configuration option.
   */
  name: string
  /**
   * String to summarize the error messaging that is logged.
   */
  errorKey: string
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

export const breakingOptions = [
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
] as const

// Used to ensure that the above is valid, without losing the ability to index the shape on `name`
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _checkTsBreakingOptions: ReadonlyArray<BreakingOption> = breakingOptions
