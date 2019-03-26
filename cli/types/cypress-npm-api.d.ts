//
// Cypress NPM api type declarations
// https://on.cypress.io/module-api
// https://github.com/cypress-io/cypress/issues/2141
//
// in the future the NPM module itself will be in TypeScript
// but for now describe it as an ambient module

declare module 'cypress' {
  /**
   * All options that one can pass to "cypress.run"
   * @see https://on.cypress.io/module-api#cypress-run
   */
  interface CypressRunOptions {
    browser: string
    ciBuildId: string
    config: object
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
    config: object
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
    run(options: Partial<CypressRunOptions>): Promise<CypressRunResult>,
    open(options: Partial<CypressOpenOptions>): Promise<void>
  }

  const cypress: CypressNpmApi
  // export = cypress
  export default cypress
}
