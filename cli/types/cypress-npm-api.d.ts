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
     * A String glob pattern of the test files to load.
     */
    testFiles: string

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
    responseTimeout: number
  }

  /**
   * All options that one can pass to "cypress.run"
   * @see https://on.cypress.io/module-api#cypress-run
   */
  interface CypressRunOptions {
    browser: string
    ciBuildId: string
    config: Partial<CypressConfiguration>
    env: object
    group: string
    headed: boolean
    key: string
    noExit: boolean
    parallel: boolean
    port: number
    project: string
    record: boolean
    reporter: string
    reporterOptions: any
    spec: string
  }

  /**
   * All options that one can pass to "cypress.open"
   * @see https://on.cypress.io/module-api#cypress-open
   */
  interface CypressOpenOptions {
    browser: string
    config: Partial<CypressConfiguration>
    detached: boolean
    env: object
    global: boolean
    port: number
    project: string
  }

  type dateTimeISO = string

  interface CypressRunResult {
    startedTestsAt: dateTimeISO
    endedTestsAt: dateTimeISO
  }

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
    run(options?: Partial<CypressRunOptions>): Promise<CypressRunResult>,
    /**
     * Opens Cypress GUI. Resolves with void when the
     * GUI is closed.
     * @see https://on.cypress.io/module-api#cypress-open
     */
    open(options?: Partial<CypressOpenOptions>): Promise<void>
  }

  const cypress: CypressNpmApi
  export default cypress
}
