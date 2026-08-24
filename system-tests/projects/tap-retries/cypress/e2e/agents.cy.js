describe('Agents', () => {
  it('registers a spy and a stub the reporter tabulates', () => {
    const target = {
      greet: () => 'hello',
      shout: () => 'HELLO',
    }

    cy.spy(target, 'greet').as('greeter')
    cy.stub(target, 'shout').returns('quiet').as('shouter')

    cy.wrap(null).then(() => {
      target.greet()
      target.greet()
      target.shout()
    })

    cy.get('@greeter').should('have.been.calledTwice')
    cy.get('@shouter').should('have.been.calledOnce')
  })

  it('creates a session the reporter lists', () => {
    cy.session('tap session', () => {
      cy.visit('cypress/e2e/aut-content.html')
    })
  })
})
