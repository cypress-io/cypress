// type tests for Cypress NPM module
// https://on.cypress.io/module-api
import cypress from 'cypress'

cypress.run // $ExpectType (options?: Partial<CypressRunOptions> | undefined) => Promise<CypressRunResult>
cypress.open // $ExpectType (options?: Partial<CypressOpenOptions> | undefined) => Promise<void>
cypress.run({
  tag: 'production,nightly'
})
cypress.run({}).then(results => {
  results // $ExpectType CypressRunResult
})
cypress.run().then(results => {
  results // $ExpectType CypressRunResult
  results.failures // $ExpectType number | undefined
  results.message // $ExpectType string | undefined
  results.runUrl // $ExpectType string | undefined
})
cypress.open() // $ExpectType Promise<void>
cypress.run() // $ExpectType Promise<CypressRunResult>

cypress.open({
  configFile: false
})

cypress.run({
  configFile: "abc123"
})
