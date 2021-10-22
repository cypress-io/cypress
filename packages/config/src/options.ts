const v = require('./validation')

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
  const status = v.isPlainObject(key, config)

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
    validation: v.isNumber,
  }, {
    name: 'baseUrl',
    defaultValue: null,
    validation: v.isFullyQualifiedUrl,
  }, {
    name: 'blockHosts',
    defaultValue: null,
    validation: v.isStringOrArrayOfStrings,
  }, {
    name: 'chromeWebSecurity',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'clientCertificates',
    defaultValue: [],
    validation: v.isValidClientCertificatesSet,
  }, {
    name: 'component',
    // runner-ct overrides
    defaultValue: {},
    validation: isValidConfig,
  }, {
    name: 'componentFolder',
    defaultValue: 'cypress/component',
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'defaultCommandTimeout',
    defaultValue: 4000,
    validation: v.isNumber,
  }, {
    name: 'downloadsFolder',
    defaultValue: 'cypress/downloads',
    validation: v.isString,
    isFolder: true,
  }, {
    name: 'e2e',
    // e2e runner overrides
    defaultValue: {},
    validation: isValidConfig,
  }, {
    name: 'env',
    defaultValue: {},
    validation: v.isPlainObject,
  }, {
    name: 'execTimeout',
    defaultValue: 60000,
    validation: v.isNumber,
  }, {
    name: 'experimentalFetchPolyfill',
    defaultValue: false,
    validation: v.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalInteractiveRunEvents',
    defaultValue: false,
    validation: v.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSessionSupport',
    defaultValue: false,
    validation: v.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalSourceRewriting',
    defaultValue: false,
    validation: v.isBoolean,
    isExperimental: true,
  }, {
    name: 'experimentalStudio',
    defaultValue: false,
    validation: v.isBoolean,
    isExperimental: true,
  }, {
    name: 'fileServerFolder',
    defaultValue: '',
    validation: v.isString,
    isFolder: true,
  }, {
    name: 'fixturesFolder',
    defaultValue: 'cypress/fixtures',
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'ignoreTestFiles',
    defaultValue: '*.hot-update.js',
    validation: v.isStringOrArrayOfStrings,
  }, {
    name: 'includeShadowDom',
    defaultValue: false,
    validation: v.isBoolean,
  }, {
    name: 'integrationFolder',
    defaultValue: 'cypress/integration',
    validation: v.isString,
    isFolder: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'nodeVersion',
    defaultValue: 'default',
    validation: v.isOneOf('default', 'bundled', 'system'),
  }, {
    name: 'numTestsKeptInMemory',
    defaultValue: 50,
    validation: v.isNumber,
  }, {
    name: 'pageLoadTimeout',
    defaultValue: 60000,
    validation: v.isNumber,
  }, {
    name: 'pluginsFile',
    defaultValue: 'cypress/plugins',
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'port',
    defaultValue: null,
    validation: v.isNumber,
  }, {
    name: 'projectId',
    defaultValue: null,
    validation: v.isString,
  }, {
    name: 'redirectionLimit',
    defaultValue: 20,
    validation: v.isNumber,
  }, {
    name: 'reporter',
    defaultValue: 'spec',
    validation: v.isString,
  }, {
    name: 'reporterOptions',
    defaultValue: null,
    validation: v.isPlainObject,
  }, {
    name: 'requestTimeout',
    defaultValue: 5000,
    validation: v.isNumber,
  }, {
    name: 'resolvedNodePath',
    defaultValue: null,
    validation: v.isString,
  }, {
    name: 'resolvedNodeVersion',
    defaultValue: null,
    validation: v.isString,
  }, {
    name: 'responseTimeout',
    defaultValue: 30000,
    validation: v.isNumber,
  }, {
    name: 'retries',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    validation: v.isValidRetriesConfig,
  }, {
    name: 'screenshotOnRunFailure',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'screenshotsFolder',
    defaultValue: 'cypress/screenshots',
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'scrollBehavior',
    defaultValue: 'top',
    validation: v.isOneOf('center', 'top', 'bottom', 'nearest', false),
  }, {
    name: 'supportFile',
    defaultValue: 'cypress/support',
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'supportFolder',
    defaultValue: false,
    validation: v.isStringOrFalse,
    isFolder: true,
  }, {
    name: 'taskTimeout',
    defaultValue: 60000,
    validation: v.isNumber,
  }, {
    name: 'testFiles',
    defaultValue: '**/*.*',
    validation: v.isStringOrArrayOfStrings,
  }, {
    name: 'trashAssetsBeforeRuns',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'userAgent',
    defaultValue: null,
    validation: v.isString,
  }, {
    name: 'video',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'videoCompression',
    defaultValue: 32,
    validation: v.isNumberOrFalse,
  }, {
    name: 'videosFolder',
    defaultValue: 'cypress/videos',
    validation: v.isString,
    isFolder: true,
  }, {
    name: 'videoUploadOnPasses',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'viewportHeight',
    defaultValue: 660,
    validation: v.isNumber,
  }, {
    name: 'viewportWidth',
    defaultValue: 1000,
    validation: v.isNumber,
  }, {
    name: 'waitForAnimations',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'watchForFileChanges',
    defaultValue: true,
    validation: v.isBoolean,
  },
]

const runtimeOptions: Array<RuntimeConfigOption> = [
  {
    name: 'autoOpen',
    defaultValue: false,
    validation: v.isBoolean,
    isInternal: true,
  }, {
    name: 'browsers',
    defaultValue: [],
    validation: v.isValidBrowserList,
  }, {
    name: 'clientRoute',
    defaultValue: '/__/',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'configFile',
    defaultValue: 'cypress.json',
    validation: v.isStringOrFalse,
    // not truly internal, but can only be set via cli,
    // so we don't consider it a "public" option
    isInternal: true,
  }, {
    name: 'devServerPublicPathRoute',
    defaultValue: '/__cypress/src',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'hosts',
    defaultValue: null,
    validation: v.isPlainObject,
  }, {
    name: 'isTextTerminal',
    defaultValue: false,
    validation: v.isBoolean,
    isInternal: true,
  }, {
    name: 'morgan',
    defaultValue: true,
    validation: v.isBoolean,
    isInternal: true,
  }, {
    name: 'modifyObstructiveCode',
    defaultValue: true,
    validation: v.isBoolean,
  }, {
    name: 'namespace',
    defaultValue: '__cypress',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'reporterRoute',
    defaultValue: '/__cypress/reporter',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'socketId',
    defaultValue: null,
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'socketIoCookie',
    defaultValue: '__socket.io',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'socketIoRoute',
    defaultValue: '/__socket.io',
    validation: v.isString,
    isInternal: true,
  }, {
    name: 'xhrRoute',
    defaultValue: '/xhrs/',
    validation: v.isString,
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
