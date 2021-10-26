const validation = require('./validation')

interface ResolvedConfigOption {
  name: string
  defaultValue: any
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
   * The new configuration key that is replacing the existing configuration key.
   */
  newName?: string
  /**
   * Whether to log the error message as a warning instead of throwing an error.
   */
  isWarning?: boolean
}

const isValidConfig = (key, config) => {
  const status = validation.isPlainObject(key, config)

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
    validation: validation.isNumber,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: validation.isFullyQualifiedUrl,
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: validation.isStringOrArrayOfStrings,
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: validation.isValidClientCertificatesSet,
  }, {
    name: 'component',
    // runner-ct overrides
    defaultValue: {},
    validation: isValidConfig,
  }, {
    name: 'componentFolder',
    defaultValue: 'cypress/component',
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: validation.isNumber,
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: validation.isString,
    isFolder: true,
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {},
    validation: isValidConfig,
  }, {
    name: 'env',
    defaultValue: {},
    validation: validation.isPlainObject,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: validation.isNumber,
  }, {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    validation: validation.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    validation: validation.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSessionSupport',
    defaultValue: false,
    validation: validation.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: validation.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalStudio',
    defaultValue: false,
    validation: validation.isBoolean,
    isExperimental: true,
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: validation.isString,
    isFolder: true,
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'ignoreTestFiles',
    defaultValue: '*.hot-update.js',
    validation: validation.isStringOrArrayOfStrings,
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: validation.isBoolean,
  }, {
    name: 'integrationFolder',
    defaultValue: 'cypress/integration',
    validation: validation.isString,
    isFolder: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'nodeVersion',
    defaultValue: 'default',
    validation: validation.isOneOf('default', 'bundled', 'system'),
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: validation.isNumber,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: validation.isNumber,
  }, {
    name: 'pluginsFile',
    defaultValue: 'cypress/plugins',
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'port',
    defaultValue: null,
    validation: validation.isNumber,
  }, {
    name: 'projectId',
    defaultValue: null,
    validation: validation.isString,
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    validation: validation.isNumber,
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: validation.isString,
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: validation.isPlainObject,
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: validation.isNumber,
  }, {
    name: 'resolvedNodePath',
    defaultValue: null,
    validation: validation.isString,
  }, {
    name: 'resolvedNodeVersion',
    defaultValue: null,
    validation: validation.isString,
  }, {
    name: 'responseTimeout',
    defaultValue: 30000,
    validation: validation.isNumber,
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    validation: validation.isValidRetriesConfig,
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: validation.isOneOf('center', 'top', 'bottom', 'nearest', false),
  }, {
    name: 'supportFile',
    defaultValue: 'cypress/support',
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: validation.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: validation.isNumber,
  }, {
    name: 'testFiles',
    defaultValue: '**/*.*',
    validation: validation.isStringOrArrayOfStrings,
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'userAgent',
    defaultValue: null,
    validation: validation.isString,
  }, {
    name: 'video',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'videoCompression',
    defaultValue: 32,
    validation: validation.isNumberOrFalse,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    validation: validation.isString,
    isFolder: true,
  }, {
    name: 'videoUploadOnPasses',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'viewportHeight',
    defaultValue: 660,
    validation: validation.isNumber,
  }, {
    name: 'viewportWidth',
    defaultValue: 1000,
    validation: validation.isNumber,
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: validation.isBoolean,
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    name: 'autoOpen',
    defaultValue: false,
    validation: validation.isBoolean,
    isInternal: true,
  }, {
    name: 'browsers',
    defaultValue: [],
    validation: validation.isValidBrowserList,
  }, {
    name: 'clientRoute',
    defaultValue: '/__/',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'configFile',
    defaultValue: 'cypress.json',
    validation: validation.isStringOrFalse,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
    isInternal: true,
  }, {
    name: 'devServerPublicPathRoute',
    defaultValue: '/__cypress/src',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'hosts',
    defaultValue: null,
    validation: validation.isPlainObject,
  }, {
    name: 'isTextTerminal',
    defaultValue: false,
    validation: validation.isBoolean,
    isInternal: true,
  }, {
    name: 'morgan',
    defaultValue: true,
    validation: validation.isBoolean,
    isInternal: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: validation.isBoolean,
  }, {
    name: 'namespace',
    defaultValue: '__cypress',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'reporterRoute',
    defaultValue: '/__cypress/reporter',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'socketId',
    defaultValue: null,
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'socketIoCookie',
    defaultValue: '__socket.io',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket.io',
    validation: validation.isString,
    isInternal: true,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: validation.isString,
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
  },
]
