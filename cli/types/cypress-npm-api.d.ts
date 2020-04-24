//
// Cypress NPM api type declarations
// https://on.cypress.io/module-api
// https://github.com/cypress-io/cypress/issues/2141
//
// in the future the NPM module itself will be in TypeScript
// but for now describe it as an ambient module

declare module 'cypress' {
  /**
   * Cypress configuration object.
   * @see https://on.cypress.io/configuration
   */
  interface CypressConfiguration {
    //
    // global options
    //

    /**
     * Url used as prefix for `cy.visit()` or `cy.request()` command’s url
     */
    baseUrl: string,
    /**
     * Any values to be set as environment variables
     */
    env: object,
    /**
     * A String or Array of glob patterns used to ignore test files
     * that would otherwise be shown in your list of tests.
     */
    ignoreTestFiles: string | string[],
    /**
     * The number of tests for which snapshots and command data are kept in memory.
     * Reduce this number if you are experiencing high memory consumption in your browser during a test run.
     */
    numTestsKeptInMemory: number,
    /**
     * Port used to host Cypress. Normally this is a randomly generated port
     */
    port: number,
    /**
     * The reporter used during the `cypress run`. Default is "spec"
     */
    reporter: string,
    /**
     * A String or Array of string glob pattern of the test files to load.
     */
    testFiles: string | string[]

    //
    // timeouts
    //

    /**
     * Time, in milliseconds, to wait until most DOM based commands
     * are considered timed out.
     */
    defaultCommandTimeout: number,
    /**
     * Time, in milliseconds, to wait for a system command to
     * finish executing during a `cy.exec()` command.
     */
    execTimeout: number,
    /**
     * Time, in milliseconds, to wait for a task to finish executing
     * during a `cy.task()` command.
     */
    taskTimeout: number,
    /**
     * Time, in milliseconds, to wait for page transition events or
     * `cy.visit()`, `cy.go()`, `cy.reload()` commands to fire
     * their page load events.
     */
    pageLoadTimeout: number,
    /**
     * Time, in milliseconds, to wait for an XHR request to go out
     * in a `cy.wait()` command.
     */
    requestTimeout: number,
    /**
     * Time, in milliseconds, to wait until a response in a
     * `cy.request()`, `cy.wait()`, `cy.fixture()`, `cy.getCookie()`,
     * `cy.getCookies()`, `cy.setCookie()`, `cy.clearCookie()`,
     * `cy.clearCookies()`, and `cy.screenshot()` commands.
    */
    responseTimeout: number,

    //
    // folders and files
    //

    /**
     * Path to folder where application files will attempt to be served from.
     */
    fileServerFolder: string,
    /**
     * Path to folder containing fixture files (Pass `false` to disable).
     */
    fixturesFolder: string | false,
    /**
     * Path to folder containing integration test files.
     */
    integrationFolder: string,
    /**
     * Path to plugins file. (Pass `false` to disable)
     */
    pluginsFile: string | false,
    /**
     * Path to folder where screenshots will be saved from `cy.screenshot()`
     * command or after a test fails during cypress run.
     */
    screenshotsFolder: string,
    /**
     * Path to file to load before test files load.
     * This file is compiled and bundled. (Pass `false` to disable).
     */
    supportFile: string | false,
    /**
     * Path to folder where videos will be saved during `cypress run`
     */
    videosFolder: string,

    //
    // screenshots
    //

    /**
     * Whether Cypress will trash assets within the `screenshotsFolder` and
     * `videosFolder` before tests run with cypress run. Default is `true`.
     */
    trashAssetsBeforeRuns: boolean,

    //
    // videos
    //

    /**
     * The quality setting for the video compression, in Constant Rate Factor (CRF).
     * The value can be false to disable compression or a value between 0 and 51,
     * where a lower value results in better quality
     * (at the expense of a higher file size).
     */
    videoCompression: number | false,
    /**
     * Whether Cypress will capture a video of the tests run with `cypress run`.
     */
    video: boolean,
    /**
     * Whether Cypress will upload the video to the Dashboard even if
     * all tests are passing. This applies only when recording your runs
     * to the Dashboard. Turn this off if you’d like the video uploaded
     * only when there are failing tests.
     */
    videoUploadOnPasses: boolean,

    //
    // browser
    //
    /**
     * Whether Chrome Web Security for `same-origin` policy and
     * `insecure mixed content` is enabled.
     */
    chromeWebSecurity: boolean,
    /**
     * Enables you to override the default user agent the
     * browser sends in all request headers.
     */
    userAgent: string,
    /**
     * A String or Array of hosts that you wish to block traffic for.
     */
    blacklistHosts: string | string[],
    /**
     * Whether Cypress will search for and replace obstructive JS code
     * in `.js` or `.html` files.
     */
    modifyObstructiveCode: boolean,

    //
    // viewport
    //
    /**
     * Default height in pixels for the application under tests’ viewport
     * (Override with `cy.viewport()` command)
     */
    viewportHeight: number,
    /**
     * Default width in pixels for the application under tests’ viewport.
     * (Override with `cy.viewport()` command)
     */
    viewportWidth: number

    //
    // animations
    //
    /**
     * The distance in pixels an element must exceed over
     * time to be considered animating.
     */
    animationDistanceThreshold: number
    /**
     * Whether to wait for elements to finish animating before executing commands.
     */
    waitForAnimations: boolean
  }

  /**
   * All options that one can pass to "cypress.run"
   * @see https://on.cypress.io/module-api#cypress-run
   * @example
    ```
    const cypress = require('cypress')
    cypress.run({
      reporter: 'junit',
      browser: 'chrome',
      config: {
        baseUrl: 'http://localhost:8080',
        chromeWebSecurity: false,
      },
      env: {
        foo: 'bar',
        baz: 'quux',
      }
    })
    ```
   */
  interface CypressRunOptions extends CypressCommonOptions {
    /**
     * Specify different browser to run tests in, either by name or by filesystem path
    */
    browser: string
    /**
     * Specify a unique identifier for a run to enable grouping or parallelization
     */
    ciBuildId: string
    /**
     * Group recorded tests together under a single run name
     */
    group: string
    /**
     * Tag string for the recorded run, like "production,nightly"
     */
    tag: string
    /**
     * Display the browser instead of running headlessly
     */
    headed: boolean
    /**
     * Hide the browser instead of running headed
     */
    headless: boolean
    /**
     * Specify your secret record key
     */
    key: string
    /**
     * Keep Cypress open after all tests run
     */
    noExit: boolean
    /**
     * Run recorded specs in parallel across multiple machines
     */
    parallel: boolean
    /**
     * Override default port
     */
    port: number
    /**
     * Whether to record the test run
     */
    record: boolean
    /**
     * Specify a mocha reporter
     */
    reporter: string
    /**
     * Specify mocha reporter options
     */
    reporterOptions: any
    /**
     * Specify the specs to run
     */
    spec: string
  }

  /**
   * All options that one can pass to "cypress.open"
   * @see https://on.cypress.io/module-api#cypress-open
   * @example
    ```
    const cypress = require('cypress')
    cypress.open({
      env: {
        username: 'Joe Doe',
        email: 'joe@acme.co'
      },
      project: '~/demos/my-project'
    })
    ```
   */
  interface CypressOpenOptions extends CypressCommonOptions {
    /**
     * Specify a filesystem path to a custom browser
     */
    browser: string
    /**
     * Open Cypress in detached mode
     */
    detached: boolean
    /**
     * Run in global mode
     */
    global: boolean
    /**
     * Override default port
     */
    port: number
  }

  /**
   * Options available for `cypress.open` and `cypress.run`
   */
  interface CypressCommonOptions {
    /**
     * Specify configuration
     */
    config: Partial<CypressConfiguration>
    /**
     * Path to the config file to be used.
     *
     * If `false` is passed, no config file will be used.
     *
     * @default "cypress.json"
     */
    configFile: string | false
    /**
     * Specify environment variables
     */
    env: object
    /**
     * Path to a specific project
     */
    project: string
  }

  // small utility types to better express meaning of other types
  type dateTimeISO = string
  type ms = number
  type hookId = string
  type testId = string
  type pixels = number

  /**
   * Cypress single test result
   */
  interface TestResult {
    testId: testId
    title: string[]
    state: string
    body: string
    /**
     * Error stack string if there is an error
     */
    stack: string | null
    /**
     * Error message if there is an error
     */
    error: string | null
    timings: any
    failedFromHookId: hookId | null
    wallClockStartedAt: dateTimeISO
    wallClockDuration: ms
    videoTimestamp: ms
  }

  /**
   * Information about a single "before", "beforeEach", "afterEach" and "after" hook.
  */
  interface HookInformation {
    hookId: hookId
    hookName: 'before' | 'beforeEach' | 'afterEach' | 'after'
    title: string[]
    body: string
  }

  /**
   * Information about a single screenshot.
   */
  interface ScreenshotInformation {
    screenshotId: string
    name: string
    testId: testId
    takenAt: dateTimeISO
    /**
     * Absolute path to the saved image
     */
    path: string
    height: pixels
    width: pixels
  }

  /**
   * Cypress test run result for a single spec.
  */
  interface RunResult {
    /**
     * Accurate test results collected by Cypress.
     */
    stats: {
      suites: number
      tests: number
      passes: number
      pending: number
      skipped: number
      failures: number
      wallClockStartedAt: dateTimeISO
      wallClockEndedAt: dateTimeISO
      wallClockDuration: ms
    },
    /**
     * Reporter name like "spec"
     */
    reporter: string
    /**
     * This is controlled by the reporter, and Cypress cannot guarantee
     * the properties. Usually this object has suites, tests, passes, etc
     */
    reporterStats: object
    hooks: HookInformation[]
    tests: TestResult[]
    error: string | null
    video: string | null
    screenshots: ScreenshotInformation[]
    /**
     * information about the spec test file.
    */
    spec: {
      /**
       * filename like "spec.js"
       */
      name: string
      /**
       * name relative to the project root, like "cypress/integration/spec.js"
      */
      relative: string
      /**
       * resolved filename of the spec
       */
      absolute: string
    },
    shouldUploadVideo: boolean
  }

  /**
   * Results returned by the test run.
   * @see https://on.cypress.io/module-api
   */
  interface CypressRunResult {
    startedTestsAt: dateTimeISO
    endedTestsAt: dateTimeISO
    totalDuration: ms
    totalSuites: number
    totalTests: number
    totalFailed: number
    totalPassed: number
    totalPending: number
    totalSkipped: number
    /**
     * If Cypress test run is being recorded, full url will be provided.
     * @see https://on.cypress.io/dashboard-introduction
     */
    runUrl?: string
    runs: RunResult[]
    browserPath: string
    browserName: string
    browserVersion: string
    osName: string
    osVersion: string
    cypressVersion: string
    // TODO add resolved object to the configuration
    config: CypressConfiguration
  }

  /**
     * If Cypress fails to run at all (for example, if there are no spec files to run),
     * then it will return a CypressFailedRunResult. Check the failures attribute.
     * @example
      ```
      const result = await cypress.run()
      if (result.failures) {
        console.error(result.message)
        process.exit(result.failures)
      }
      ```
     *
  **/
  interface CypressFailedRunResult {
    failures: number
    message: string
  }

  /**
   * Cypress NPM module interface.
   * @see https://on.cypress.io/module-api
   * @example
    ```
    const cypress = require('cypress')
    cypress.run().then(results => ...)
    ```
  */
  interface CypressNpmApi {
    /**
     * Execute a headless Cypress test run.
     * @see https://on.cypress.io/module-api#cypress-run
     * @example
     ```
     const cypress = require('cypress')
     // runs all spec files matching a wildcard
     cypress.run({
       spec: 'cypress/integration/admin*-spec.js'
     }).then(results => {
       // inspect results object
     })
     ```
     */
    run(options?: Partial<CypressRunOptions>): Promise<CypressRunResult | CypressFailedRunResult>,
    /**
     * Opens Cypress GUI. Resolves with void when the
     * GUI is closed.
     * @see https://on.cypress.io/module-api#cypress-open
     */
    open(options?: Partial<CypressOpenOptions>): Promise<void>
  }

  // export Cypress NPM module interface
  const cypress: CypressNpmApi
  export = cypress
}
