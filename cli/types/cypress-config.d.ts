
  interface ConfigOptions {
    /**
     * The distance in pixels an element must exceed over time to be considered animating
     * @default 5
     */
     animationDistanceThreshold: number
     
    /**
     * A String or Array of hosts that you wish to block traffic for. Please read the notes for examples on using this https://on.cypress.io/configuration#blockHosts
     * @default null
     */
     blockHosts: string | Array<string>
     
    /**
     * Whether Chrome Web Security for same-origin policy and insecure mixed content is enabled. Read more about this at https://on.cypress.io/web-security
     * @default true
     */
     chromeWebSecurity: boolean
     
    /**
     * Defines client certificates to use when sending requests to the specified URLs
     * @default 
     */
    //  clientCertificates: array
     
    /**
     * Time, in milliseconds, to wait until most DOM based commands are considered timed out
     * @default 4000
     */
     defaultCommandTimeout: number
     
    /**
     * Path to folder where files downloaded during a test are saved
     * @default cypress/downloads
     */
     downloadsFolder: string
     
    /**
     * Any values to be set as environment variables. See https://on.cypress.io/environment-variables
     * @default [object Object]
     */
     env: object
     
    /**
     * Time, in milliseconds, to wait for a system command to finish executing during a cy.exec() command
     * @default 60000
     */
     execTimeout: number
     
    /**
     * Polyfills `window.fetch` to enable Network spying and stubbing
     * @default false
     */
     experimentalFetchPolyfill: boolean
     
    /**
     * Allows listening to the `before:run`, `after:run`, `before:spec`, and `after:spec` events in the plugins file during interactive mode.
     * @default false
     */
     experimentalInteractiveRunEvents: boolean
     
    /**
     * Enable experimental session support. See https://on.cypress.io/session
     * @default false
     */
     experimentalSessionSupport: boolean
     
    /**
     * Enables AST-based JS/HTML rewriting. This may fix issues caused by the existing regex-based JS/HTML replacement algorithm.
     * @default false
     */
     experimentalSourceRewriting: boolean
     
    /**
     * Path to folder where application files will attempt to be served from
     * @default 
     */
     fileServerFolder: 
     
    /**
     * Path to folder containing fixture files (Pass false to disable)
     */
     fixturesFolder: string | boolean
     
    /**
     * Enables including elements within the shadow DOM when using querying commands (e.g. cy.get(), cy.find()). Can be set globally in cypress.config.{ts|js}, per-suite or per-test in the test configuration object, or programmatically with Cypress.config()
     * @default false
     */
     includeShadowDom: boolean
     
    /**
     * The delay, in milliseconds, between keystrokes while typing with .type(). Must be a non-negative number.
     * @default 10
     */
     keystrokeDelay: number
     
    /**
     * Whether Cypress will search for and replace obstructive JS code found in .js or .html files that prevent Cypress from working. Please read the notes for more information on this setting. https://on.cypress.io/configuration#modifyObstructiveCode
     * @default true
     */
     modifyObstructiveCode: boolean
     
    /**
     * DEPRECATED: If set to 'bundled', Cypress will use the Node version bundled with Cypress. Otherwise, Cypress will use the Node version that was used to launch the Cypress. This Node version is used when executing your plugins file and building spec files.
     * @default system
     */
     nodeVersion: 
     
    /**
     * The number of tests for which snapshots and command data are kept in memory. Reduce this number if you are experiencing high memory consumption in your browser during a test run.
     * @default 50
     */
     numTestsKeptInMemory: number
     
    /**
     * Time, in milliseconds, to wait for page transition events or cy.visit(), cy.go(), cy.reload() commands to fire their page load events. Network requests are limited by the underlying operating system, and may still time out if this value is increased.
     * @default 60000
     */
     pageLoadTimeout: number
     
    /**
     * Port used to host Cypress. Normally this is a randomly generated port
     * @default null
     */
     port: null | number
     
    /**
     * A 6 character string use to identify this project in the Cypress Dashboard. See https://on.cypress.io/dashboard-service#Identification
     * @default null
     */
     projectId: string
     
    /**
     * The number of times that the application under test can redirect before erroring.
     * @default 20
     */
     redirectionLimit: number
     
    /**
     * The reporter used when running headlessly or in CI. See https://on.cypress.io/reporters
     * @default spec
     */
     reporter: string
     
    /**
     * The reporter options used. Supported options depend on the reporter. See https://on.cypress.io/reporters#Reporter-Options
     * @default null
     */
     reporterOptions: object
     
    /**
     * Time, in milliseconds, to wait for an XHR request to go out in a cy.wait() command
     * @default 5000
     */
     requestTimeout: number
     
    /**
     * Time, in milliseconds, to wait until a response in a cy.request(), cy.wait(), cy.fixture(), cy.getCookie(), cy.getCookies(), cy.setCookie(), cy.clearCookie(), cy.clearCookies(), and cy.screenshot() commands
     * @default 30000
     */
     responseTimeout: number
     
    /**
     * The number of times to retry a failing. Can be configured to apply only in runMode or openMode
     * @default [object Object]
     */
     retries: object | number | null
     
    /**
     * Whether Cypress will take a screenshot when a test fails during cypress run
     * @default true
     */
     screenshotOnRunFailure: boolean
     
    /**
     * Path to folder where screenshots will be saved from cy.screenshot() command or after a test fails during cypress run
     * @default cypress/screenshots
     */
     screenshotsFolder: string | boolean
     
    /**
     * Viewport position to which an element should be scrolled prior to action commands. Setting `false` disables scrolling.
     * @default top
     */
     scrollBehavior: 
     
    /**
     * Time, in milliseconds, to wait for a task to finish executing during a cy.task() command
     * @default 60000
     */
     taskTimeout: number
     
    /**
     * Whether Cypress will trash assets within the screenshotsFolder and videosFolder before tests run with cypress run
     * @default true
     */
     trashAssetsBeforeRuns: boolean
     
    /**
     * Enables you to override the default user agent the browser sends in all request headers. User agent values are typically used by servers to help identify the operating system, browser, and browser version. See User-Agent MDN Documentation for example user agent values here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
     * @default null
     */
     userAgent: string
     
    /**
     * Whether Cypress will capture a video of the tests run with cypress run
     * @default true
     */
     video: boolean
     
    /**
     * The quality setting for the video compression, in Constant Rate Factor (CRF). The value can be false to disable compression or a value between 0 and 51, where a lower value results in better quality (at the expense of a higher file size).
     * @default 32
     */
     videoCompression: number | boolean
     
    /**
     * Path to folder where videos will be saved during cypress run
     * @default cypress/videos
     */
     videosFolder: string
     
    /**
     * Whether Cypress will process, compress, and upload videos to the Dashboard even when all tests in a spec file are passing. This only applies when recording your runs to the Dashboard. Turn this off if you’d like to only upload the spec file’s video when there are failing tests.
     * @default true
     */
     videoUploadOnPasses: boolean
     
    /**
     * Whether to wait for elements to finish animating before executing commands
     * @default true
     */
     waitForAnimations: boolean
     
    /**
     * Whether Cypress will watch and restart tests on test file changes
     * @default true
     */
     watchForFileChanges: boolean
     
  }

  interface ComponentConfigOptions extends ConfigOptions {
    /**
     * All functionality related to starting a component testing dev server (previously in the pluginsFile) has moved here.
     * @default null
     */
     devServer: object
     
    /**
     * Configuration specific to starting a component testing dev server in the pluginsFile has moved here.
     * @default [object Object]
     */
     devServerConfig: object
     
    /**
     * A String or Array of glob patterns used to ignore test files that would otherwise be shown in your list of tests. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.
     * @default **/__snapshots__/*,**/__image_snapshots__/*
     */
     excludeSpecPattern: string | Array<string>
     
    /**
     * All functionality related to setting up events or modifying the config (previously in the pluginsFile) has moved here.
     * @default undefined
     */
     setupNodeEvents: object
     
    /**
     * Slow test threshold in milliseconds. Only affects the visual output of some reporters. For example, the spec reporter will display the test time in yellow if over the threshold. See https://on.cypress.io/configuration#Timeouts
     * @default 250
     */
     slowTestThreshold: number
     
    /**
     * A String or Array of glob patterns used to fine your list of test files. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.
     * @default **/*.cy.{js,jsx,ts,tsx}
     */
     specPattern: string | Array<string>
     
    /**
     * Path to file to load before test files load. This file is compiled and bundled. (Pass false to disable)
     * @default cypress/support/component.{js,jsx,ts,tsx}
     */
     supportFile: string | boolean
     
    /**
     * Default height in pixels for the application under tests’ viewport.
     * @default 500
     */
     viewportHeight: number
     
    /**
     * Default width in pixels for the application under tests’ viewport.
     * @default 500
     */
     viewportWidth: number
     
  }

  interface E2EConfigOptions extends ConfigOptions {
    /**
     * Url used as prefix for cy.visit() or cy.request() command’s url. Example http://localhost:3030 or https://test.my-domain.com
     * @default null
     */
     baseUrl: null | string
     
    /**
     * A String or Array of glob patterns used to ignore test files that would otherwise be shown in your list of tests. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.
     * @default *.hot-update.js
     */
     excludeSpecPattern: string | Array<string>
     
    /**
     * All functionality related to setting up events or modifying the config (previously in the pluginsFile) has moved here.
     * @default undefined
     */
     setupNodeEvents: object
     
    /**
     * Slow test threshold in milliseconds. Only affects the visual output of some reporters. For example, the spec reporter will display the test time in yellow if over the threshold. See https://on.cypress.io/configuration#Timeouts
     * @default 10000
     */
     slowTestThreshold: number
     
    /**
     * A String or Array of glob patterns used to fine your list of test files. Cypress uses minimatch with the options: {dot: true, matchBase: true}. We suggest using http://globtester.com to test what files would match.
     * @default cypress/support/e2e.{js,jsx,ts,tsx}
     */
     specPattern: string | Array<string>
     
    /**
     * Path to file to load before test files load. This file is compiled and bundled. (Pass false to disable)
     * @default cypress/support/e2e.{js,jsx,ts,tsx}
     */
     supportFile: string | boolean
     
    /**
     * Default height in pixels for the application under tests’ viewport.
     * @default 660
     */
     viewportHeight: number
     
    /**
     * Default width in pixels for the application under tests’ viewport.
     * @default 1000
     */
     viewportWidth: number
     
  }