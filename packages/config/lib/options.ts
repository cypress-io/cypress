import os from 'os'
import validate from './validation'
// @ts-ignore
import pkg from '@packages/root'

type TestingType = 'e2e' | 'component'

interface ComplicatedType {
  name: string
  value?: any
}
interface ResolvedConfigOption {
  name: string
  defaultValue?: any
  description: any
  validation: Function
  type: string | Array<string> | ComplicatedType | Array<ComplicatedType>
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

export const testingTypeConfigOptions: Array<ResolvedConfigOption> = [
  {
    name: 'baseUrl',
    description: 'Url used as prefix for cy.visit() or cy.request() command’s url. Example http://localhost:3030 or https://test.my-domain.com',
    defaultValue: null,
    type: ['null', 'string'],
    validation: validate.isFullyQualifiedUrl,
    canUpdateDuringTestTime: true,
  },
  {
    name: 'devServer',
    description: 'All functionality related to starting a component testing dev server (previously in the pluginsFile) has moved here.',
    defaultValue: null,
    type: 'object',
    validation: () => true,
    canUpdateDuringTestTime: false,
  },
  {
    name: 'devServerConfig',
    description: 'Configuration specific to starting a component testing dev server in the pluginsFile has moved here.',
    defaultValue: {},
    type: 'object',
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: false,
  },
  {
    name: 'excludeSpecPattern',
    description: 'A String or Array of glob patterns used to ignore test files that would otherwise be shown in your list of tests. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? ['**/__snapshots__/*', '**/__image_snapshots__/*'] : '*.hot-update.js',
    type: [{ name: 'string' }, { name: 'array', value: 'string' }],
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: true,
  }, {
    name: 'setupNodeEvents',
    description: 'All functionality related to setting up events or modifying the config (previously in the pluginsFile) has moved here.',
    type: 'object',
    validation: () => true,
    canUpdateDuringTestTime: false,
  },
  {
    name: 'slowTestThreshold',
    description: 'Slow test threshold in milliseconds. Only affects the visual output of some reporters. For example, the spec reporter will display the test time in yellow if over the threshold. See https://on.cypress.io/configuration#Timeouts',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 250 : 10000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  },
  {
    name: 'specPattern',
    description: 'A String or Array of glob patterns used to fine your list of test files. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? '**/*.cy.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
    type: [{ name: 'string' }, { name: 'array', value: 'string' }],
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: true,
  },
  {
    name: 'supportFile',
    'description': 'Path to file to load before test files load. This file is compiled and bundled. (Pass false to disable)',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 'cypress/support/component.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
    validation: validate.isStringOrFalse,
    'type': [
      'string',
      'boolean',
    ],
    canUpdateDuringTestTime: false,
  },
  {
    name: 'viewportHeight',
    description: 'Default height in pixels for the application under tests’ viewport.',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 660,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'viewportWidth',
    description: 'Default width in pixels for the application under tests’ viewport.',
    defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 500 : 1000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  },
]

// NOTE:
// If you add/remove/change a config value, make sure to update the following
// - cli/types/index.d.ts (including allowed config options on TestOptions)
//
// Add options in alphabetical order for better readability
export const projectConfigOptions: Array<ResolvedConfigOption> = [
  {
    name: 'animationDistanceThreshold',
    description: 'The distance in pixels an element must exceed over time to be considered animating',
    defaultValue: 5,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  },
  {
    name: 'blockHosts',
    description: 'A String or Array of hosts that you wish to block traffic for. Please read the notes for examples on using this https://on.cypress.io/configuration#blockHosts',
    defaultValue: null,
    type: [{ name: 'string' }, { name: 'array', value: 'string' }],
    validation: validate.isStringOrArrayOfStrings,
    canUpdateDuringTestTime: true,
  }, {
    name: 'chromeWebSecurity',
    description: 'Whether Chrome Web Security for same-origin policy and insecure mixed content is enabled. Read more about this at https://on.cypress.io/web-security',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'clientCertificates',
    description: 'Defines client certificates to use when sending requests to the specified URLs',
    defaultValue: [],
    type: 'array',
    // items: 'complex',
    validation: validate.isValidClientCertificatesSet,
    canUpdateDuringTestTime: false,
  },
  // {
  //   name: 'component',
  //   description: 'Component testing specific configuration',
  //   // runner-ct overrides
  //   defaultValue: {
  //     // devServer
  //     // devServerConfig
  //     specPattern: '**/*.cy.{js,jsx,ts,tsx}',
  //     supportFile: 'cypress/support/component.{js,jsx,ts,tsx}',
  //     slowTestThreshold: 250,
  //     viewportHeight: 500,
  //     viewportWidth: 500,
  //   },
  //   type: 'object',
  //   // items: 'complex'
  //   validation: isValidConfig,
  //   canUpdateDuringTestTime: false,
  // },
  {
    name: 'defaultCommandTimeout',
    description: 'Time, in milliseconds, to wait until most DOM based commands are considered timed out',
    defaultValue: 4000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'downloadsFolder',
    description: 'Path to folder where files downloaded during a test are saved',
    defaultValue: 'cypress/downloads',
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  },
  // {
  //   name: 'e2e',
  //   description: 'E2E testing specific configutation',
  //   // e2e runner overrides
  //   defaultValue: {
  //     // nodeEvents: () => {},
  //     specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  //     supportFile: 'cypress/support/e2e.{js,jsx,ts,tsx}',
  //     slowTestThreshold: 10000,
  //     viewportHeight: 660,
  //     viewportWidth: 1000,
  //   },
  //   type: 'object',
  //   // items
  //   validation: isValidConfig,
  //   canUpdateDuringTestTime: false,
  // },
  {
    name: 'env',
    description: 'Any values to be set as environment variables. See https://on.cypress.io/environment-variables',
    defaultValue: {},
    type: 'object',
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: true,
  }, {
    name: 'execTimeout',
    description: 'Time, in milliseconds, to wait for a system command to finish executing during a cy.exec() command',
    defaultValue: 60000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  },
  {
    name: 'experimentalFetchPolyfill',
    description: 'Polyfills `window.fetch` to enable Network spying and stubbing',
    defaultValue: false,
    type: 'boolean',
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalInteractiveRunEvents',
    description: 'Allows listening to the `before:run`, `after:run`, `before:spec`, and `after:spec` events in the plugins file during interactive mode.',
    defaultValue: false,
    type: 'boolean',
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'experimentalSessionSupport',
    description: 'Enable experimental session support. See https://on.cypress.io/session',
    defaultValue: false,
    type: 'boolean',
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: true,
  }, {
    name: 'experimentalSourceRewriting',
    description: 'Enables AST-based JS/HTML rewriting. This may fix issues caused by the existing regex-based JS/HTML replacement algorithm.',
    defaultValue: false,
    type: 'boolean',
    validation: validate.isBoolean,
    isExperimental: true,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fileServerFolder',
    description: 'Path to folder where application files will attempt to be served from',
    defaultValue: '',
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'fixturesFolder',
    description: 'Path to folder containing fixture files (Pass false to disable)',
    defaultValue: 'cypress/fixtures',
    type: [
      'string',
      'boolean',
    ],
    validation: validate.isStringOrFalse,
    canUpdateDuringTestTime: false,
  }, {
    name: 'includeShadowDom',
    description: 'Enables including elements within the shadow DOM when using querying commands (e.g. cy.get(), cy.find()). Can be set globally in cypress.config.{ts|js}, per-suite or per-test in the test configuration object, or programmatically with Cypress.config()',
    defaultValue: false,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'keystrokeDelay',
    description: 'The delay, in milliseconds, between keystrokes while typing with .type(). Must be a non-negative number.',
    defaultValue: 10,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'modifyObstructiveCode',
    description: 'Whether Cypress will search for and replace obstructive JS code found in .js or .html files that prevent Cypress from working. Please read the notes for more information on this setting. https://on.cypress.io/configuration#modifyObstructiveCode',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'nodeVersion',
    description: 'DEPRECATED: If set to \'bundled\', Cypress will use the Node version bundled with Cypress. Otherwise, Cypress will use the Node version that was used to launch the Cypress. This Node version is used when executing your plugins file and building spec files.',
    // 'defaultValue': 'system',
    // 'enum': [
    //   'system',
    //   'bundled',
    // ],
    type: { name: 'string', value: ['system', 'bundled'] },
    validation: validate.isOneOf('bundled', 'system'),
    canUpdateDuringTestTime: false,
  }, {
    name: 'numTestsKeptInMemory',
    description: 'The number of tests for which snapshots and command data are kept in memory. Reduce this number if you are experiencing high memory consumption in your browser during a test run.',
    defaultValue: 50,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'pageLoadTimeout',
    description: 'Time, in milliseconds, to wait for page transition events or cy.visit(), cy.go(), cy.reload() commands to fire their page load events. Network requests are limited by the underlying operating system, and may still time out if this value is increased.',
    defaultValue: 60000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'port',
    description: 'Port used to host Cypress. Normally this is a randomly generated port',
    defaultValue: null,
    type: ['null', 'number'],
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'projectId',
    description: 'A 6 character string use to identify this project in the Cypress Dashboard. See https://on.cypress.io/dashboard-service#Identification',
    defaultValue: null,
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: true,
  }, {
    name: 'redirectionLimit',
    description: 'The number of times that the application under test can redirect before erroring.',
    defaultValue: 20,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporter',
    description: 'The reporter used when running headlessly or in CI. See https://on.cypress.io/reporters',
    defaultValue: 'spec',
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: true,
  }, {
    name: 'reporterOptions',
    description: 'The reporter options used. Supported options depend on the reporter. See https://on.cypress.io/reporters#Reporter-Options',
    defaultValue: null,
    type: 'object',
    validation: validate.isPlainObject,
    canUpdateDuringTestTime: true,
  }, {
    name: 'requestTimeout',
    description: 'Time, in milliseconds, to wait for an XHR request to go out in a cy.wait() command',
    defaultValue: 5000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'responseTimeout',
    description: 'Time, in milliseconds, to wait until a response in a cy.request(), cy.wait(), cy.fixture(), cy.getCookie(), cy.getCookies(), cy.setCookie(), cy.clearCookie(), cy.clearCookies(), and cy.screenshot() commands',
    defaultValue: 30000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'retries',
    description: 'The number of times to retry a failing. Can be configured to apply only in runMode or openMode',
    defaultValue: {
      runMode: 0,
      openMode: 0,
    },
    type: [
      'object',
      'number',
      'null',
    ],
    validation: validate.isValidRetriesConfig,
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotOnRunFailure',
    description: 'Whether Cypress will take a screenshot when a test fails during cypress run',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'screenshotsFolder',
    description: 'Path to folder where screenshots will be saved from cy.screenshot() command or after a test fails during cypress run',
    defaultValue: 'cypress/screenshots',
    type: [
      'string',
      'boolean',
    ],
    validation: validate.isStringOrFalse,
    canUpdateDuringTestTime: false,
  },

  {
    name: 'scrollBehavior',
    description: 'Viewport position to which an element should be scrolled prior to action commands. Setting `false` disables scrolling.',
    defaultValue: 'top',
    // 'enum': [
    //   false,
    //   'center',
    //   'top',
    //   'bottom',
    //   'nearest',
    // ],
    type: { name: 'string', value: ['center', 'top', 'bottom', 'nearest', false] },
    validation: validate.isOneOf('center', 'top', 'bottom', 'nearest', false),
    canUpdateDuringTestTime: true,
  },
  // {
  //   name: 'supportFile',
  // "description": "Path to file to load before test files load. This file is compiled and bundled. (Pass false to disable)",
  //   defaultValue: (options: Record<string, any> = {}) => options.testingType === 'component' ? 'cypress/support/component.{js,jsx,ts,tsx}' : 'cypress/support/e2e.{js,jsx,ts,tsx}',
  //   validation: validate.isStringOrFalse,
  // "type": [
  //   "string",
  //   "boolean"
  // ],
  //   isFolder: true,
  //   canUpdateDuringTestTime: false,
  // },
  // {
  //   name: 'supportFolder',
  //   defaultValue: false,
  //   validation: validate.isStringOrFalse,
  //   isFolder: true,
  //   canUpdateDuringTestTime: false,
  // },
  {
    name: 'taskTimeout',
    description: 'Time, in milliseconds, to wait for a task to finish executing during a cy.task() command',
    defaultValue: 60000,
    type: 'number',
    validation: validate.isNumber,
    canUpdateDuringTestTime: true,
  }, {
    name: 'trashAssetsBeforeRuns',
    description: 'Whether Cypress will trash assets within the screenshotsFolder and videosFolder before tests run with cypress run',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'userAgent',
    description: 'Enables you to override the default user agent the browser sends in all request headers. User agent values are typically used by servers to help identify the operating system, browser, and browser version. See User-Agent MDN Documentation for example user agent values here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent',
    defaultValue: null,
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'video',
    description: 'Whether Cypress will capture a video of the tests run with cypress run',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoCompression',
    description: 'The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be false to disable compression or a value between 0 and 51, where a lower value results in better quality (at the expense of a higher file size).',
    defaultValue: 32,
    type: ['number', 'boolean'],
    validation: validate.isNumberOrFalse,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videosFolder',
    description: 'Path to folder where videos will be saved during cypress run',
    defaultValue: 'cypress/videos',
    type: 'string',
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'videoUploadOnPasses',
    description: 'Whether Cypress will process, compress, and upload videos to the Dashboard even when all tests in a spec file are passing. This only applies when recording your runs to the Dashboard. Turn this off if you’d like to only upload the spec file’s video when there are failing tests.',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  },
  {
    name: 'waitForAnimations',
    description: 'Whether to wait for elements to finish animating before executing commands',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: true,
  }, {
    name: 'watchForFileChanges',
    description: 'Whether Cypress will watch and restart tests on test file changes',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  },
]

const resolvedOptions: Array<ResolvedConfigOption> = [
  {
    name: 'arch',
    description: 'The architecture of the machine running Cypress.',
    defaultValue: () => os.arch(),
    type: ['string'],
    validation: validate.isString,
  },
  {
    name: 'exit',
    description: 'Cypress CLI option to prevent the Cypress Test Runner from exiting after running tests in a spec file.',
    defaultValue: true,
    type: 'boolean',
    validation: validate.isBoolean,
    canUpdateDuringTestTime: false,
  },
  {
    name: 'platform',
    description: 'The platform of the machine running Cypress.',
    defaultValue: () => os.platform(),
    type: 'string',
    validation: validate.isString,
  },
  {
    name: 'resolvedNodePath',
    description: 'The path of the Node version being used to run Cypress, build the spec files and execute the nodeEvents (e2e) and/or devServer (component).',
    defaultValue: null,
    type: ['null', 'string'],
    validation: validate.isString,
    canUpdateDuringTestTime: false,
  }, {
    name: 'resolvedNodeVersion',
    description: 'The Node version being used to run Cypress, build the spec files and execute the nodeEvents (e2e) and/or devServer (component).',
    defaultValue: null,
    type: ['null', 'string'],
    validation: validate.isString,
    canUpdateDuringTestTime: false,
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
    defaultValue: 'cypress.config.js',
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

export const options: Array<ResolvedConfigOption | RuntimeConfigOption> = [
  ...projectConfigOptions,
  ...resolvedOptions,
  ...runtimeOptions,
]

export const breakingOptions: Array<BreakingOption> = [
  {
    name: 'blacklistHosts',
    errorKey: 'RENAMED_CONFIG_OPTION',
    newName: 'blockHosts',
  }, {
    name: 'componentFolder',
    errorKey: 'REMOVED_CONFIG_OPTION',
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
    name: 'experimentalStudio',
    errorKey: 'REMOVED_CONFIG_OPTION',
  }, {
    name: 'firefoxGcInterval',
    errorKey: 'FIREFOX_GC_INTERVAL_REMOVED',
    isWarning: true,
  }, {
    name: 'ignoreTestFiles',
    errorKey: 'RENAMED_CONFIG_OPTION_AND_MOVE_SCOPE',
    newName: 'excludeSpecPattern',
  }, {
    name: 'integrationFolder',
    errorKey: 'REMOVED_CONFIG_OPTION',
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
    name: 'pluginsFile',
    errorKey: 'REMOVED_CONFIG_OPTION',
  },
  {
    name: 'testFiles',
    errorKey: 'RENAMED_CONFIG_OPTION_AND_MOVE_SCOPE',
    newName: 'specPattern',
  },
]

export const breakingRootOptions: Array<BreakingOption> = [
  {
    name: 'baseUrl',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG_E2E',
    isWarning: false,
    testingTypes: ['e2e'],
  },
  {
    name: 'excludeSpecPattern',
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
    name: 'supportFile',
    errorKey: 'CONFIG_FILE_INVALID_ROOT_CONFIG',
    isWarning: false,
    testingTypes: ['component', 'e2e'],
  },
]

export const testingTypeBreakingOptions: { e2e: Array<BreakingOption>, component: Array<BreakingOption> } = {
  e2e: [
    {
      name: 'devServer',
      errorKey: 'CONFIG_FILE_INVALID_TESTING_TYPE_CONFIG_E2E',
      isWarning: false,
    },
    {
      name: 'devServerConfig',
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
  ],
}
