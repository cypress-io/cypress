// type tests for Cypress NPM module
// https://on.cypress.io/module-api
import cypress from 'cypress'

cypress.run // $ExpectType (options?: Partial<CypressRunOptions> | undefined) => Promise<CypressRunResult | CypressFailedRunResult>
cypress.open // $ExpectType (options?: Partial<CypressOpenOptions> | undefined) => Promise<void>
cypress.run({
  tag: 'production,nightly'
})
cypress.run({}).then(results => {
  results // $ExpectType CypressRunResult | CypressFailedRunResult
})
cypress.run().then(results => {
  results // $ExpectType CypressRunResult | CypressFailedRunResult
  if ('runs' in results) { // results is CypressRunResult
    results.runUrl // $ExpectType string | undefined
  } else {
    results.failures // $ExpectType number
    results.message // $ExpectType string
  }
})
cypress.open() // $ExpectType Promise<void>
cypress.run() // $ExpectType Promise<CypressRunResult | CypressFailedRunResult>

cypress.open({
  configFile: false
})

cypress.run({
  configFile: "abc123"
})

// provide only some config options
const runConfig: Cypress.ConfigOptions = {
  baseUrl: 'http://localhost:8080',
  env: {
    login: false
  },
}
cypress.run({ config: runConfig })

cypress.run({}).then((results) => {
  results as CypressCommandLine.CypressRunResult // $ExpectType CypressRunResult
})

// the caller can determine if Cypress ran or failed to launch
cypress.run().then(results => {
  if (results.status === 'failed') {
    results // $ExpectType CypressFailedRunResult
  } else {
    results // $ExpectType CypressRunResult
    results.status // $ExpectType "finished"
  }
})
