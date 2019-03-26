import cypress from 'cypress'

cypress.run // $ExpectType (options: Partial<CypressRunOptions>) => Promise<CypressRunResult>
cypress.open // $ExpectType (options: Partial<CypressOpenOptions>) => Promise<void>
cypress.run({}).then(results => {
  results // $ExpectType CypressRunResult
})
