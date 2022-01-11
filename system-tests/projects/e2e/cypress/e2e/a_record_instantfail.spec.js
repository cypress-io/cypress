Cypress.run = () => {
  // force a plugin crash immediately
  // e.g. to test when spec is skipped that Cypress.run is never called
  Cypress.backend('task', {
    task: 'plugins:crash',
    arg: '',
    timeout: 6000,
  })
}

describe('a spec', () => {
  it('a test', () => {
  })
})
