import cypress from 'cypress'

cypress.run // $ExpectType (options?: Partial<CypressRunOptions> | undefined) => Promise<CypressRunResult>
cypress.open // $ExpectType (options?: Partial<CypressOpenOptions> | undefined) => Promise<void>
cypress.run({}).then(results => {
  results // $ExpectType CypressRunResult
})
cypress.run().then(results => {
  results // $ExpectType CypressRunResult
})
cypress.open() // $ExpectType Promise<void>
