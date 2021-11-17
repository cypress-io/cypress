const validate = require('./validation')

interface ResolvedConfigOption {
  name: string
  defaultValue?: any
  validation: Function
  isFolder?: boolean
  isExperimental?: boolean
}

interface RuntimeConfigOption {
  name: string
  defaultValue: any
  validation: Function
  isInternal?: boolean
}

interface BreakingOption {
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

const isValidConfig = (key, config) => {
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
    validation: isValidConfig,
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
    validation: isValidConfig,
  }, {
    name: 'env',
    defaultValue: {},
    validation: validate.isPlainObject,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
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
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validate.isNumber,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validate.isNumber,
  }, {
    name: 'pluginsFile',
    defaultValue: 'cypress/plugins',
    validation: validate.isStringOrFalse,
    isFolder: true,
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
    name: 'slowTestThreshold',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
    validation: validate.isNumber,
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
]

const runtimeOptions: Array<RuntimeConfigOption> = [
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
    defaultValue: 'cypress.json',
    validation: validate.isStringOrFalse,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
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
    defaultValue: '__socket.io',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket.io',
    validation: validate.isString,
    isInternal: true,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: validate.isString,
    isInternal: true,
  },
]

export const options: Array<ResolvedConfigOption|RuntimeConfigOption> = [
  ...resolvedOptions,
  ...runtimeOptions,
]

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
]
