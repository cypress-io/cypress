// https://github.com/cypress-io/cypress/issues/26605
describe('fail handlers', () => {
  it('passes when a cy.on handler returns without throwing', () => {
    cy.on('fail', () => {})

    cy.get('#does-not-exist', { timeout: 100 })
  })

  it('skips the commands after a failure a handler swallowed', () => {
    // The handler would also swallow an error from the command after the
    // failure, so rethrow that one to make the test fail if the command runs.
    cy.on('fail', (err) => {
      if (err.message === 'a command after the failure ran') {
        throw err
      }
    })

    cy.get('#does-not-exist', { timeout: 100 })
    cy.then(() => {
      throw new Error('a command after the failure ran')
    })
  })

  it('fails when a cy.on handler rethrows the error', () => {
    cy.on('fail', (err) => {
      throw err
    })

    cy.get('#does-not-exist', { timeout: 100 })
  })

  it('fails when a test with a done callback never calls it', { defaultCommandTimeout: 100 }, (done) => {
    cy.on('fail', () => {})

    cy.get('#does-not-exist')
  })

  describe('with a Cypress.on handler', () => {
    const swallow = () => {}

    before(() => {
      Cypress.on('fail', swallow)
    })

    after(() => {
      Cypress.off('fail', swallow)
    })

    it('passes when the handler returns without throwing', () => {
      cy.get('#does-not-exist', { timeout: 100 })
    })
  })
})
