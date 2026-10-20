// One spec carrying every kind of row an agent meets in a real command log: a
// hook, a stubbed route and the event row annotating the wait on it, a cy.log, a
// dom alias, a typed field with its own event table, and a click whose snapshots
// differ either side of it.
describe('Journey', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/users', { statusCode: 200, body: { ok: true } }).as('getUsers')
  })

  it('walks a page with network, logs, typing and a click', () => {
    cy.visit('cypress/e2e/journey.html')
    cy.wait('@getUsers')
    cy.log('the stub answered')
    cy.get('#name').as('nameField').type('tap')
    cy.get('@nameField').should('have.value', 'tap')
    cy.get('#toggle').click()
    cy.get('#status').should('have.text', 'clicked')
    Cypress.log({ name: 'checkpoint', message: 'the page settled' }).end()
  })
})
