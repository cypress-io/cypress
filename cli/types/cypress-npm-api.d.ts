//
// Cypress NPM api type declarations
// https://on.cypress.io/module-api
// https://github.com/cypress-io/cypress/issues/2141
//
// in the future the NPM module itself will be in TypeScript
// but for now describe it as an ambient module

declare module 'cypress' {
  interface CypressConfiguration {
    env: object
  }

  type dateTimeISO = string

  interface CypressRunResult {
    startedTestsAt: dateTimeISO
    endedTestsAt: dateTimeISO
  }

  interface CypressNpmApi {
    run(options: CypressConfiguration): Promise<CypressRunResult>,
    open(options: CypressConfiguration): Promise<void>
  }

  const cypress: CypressNpmApi
  export = cypress
}
