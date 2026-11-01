describe('remote driver: misc commands in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  it('.focused()', () => {
    cy.get('#button').click().focused().should('have.id', 'button')
  })

  it('.wrap()', () => {
    cy.wrap({ foo: 'bar' }).should('deep.equal', { foo: 'bar' })
  })

  it('.debug()', () => {
    cy.get('#button').debug().should('have.id', 'button')
  })

  it('.pause()', () => {
    cy.once('paused', (nextCommandName) => {
      expect(nextCommandName).to.equal('wrap')

      Cypress.emit('resume:all')
    })

    cy.pause().wrap({}).should('deep.eq', {})
  })

  it('.task()', () => {
    cy.task('return:arg', 'works').should('eq', 'works')
  })
})
