it('test', () => {
  const object = {
    foo: () => {},
  }

  const spy = cy.spy(object, 'foo').as('fooSpy')

  // cy.spy(Cypress, 'log').as('logSpy')
  cy.intercept('*form.html', { fixture: 'form.html' }).as('formPage')

  cy.visit('/fixtures/form.html')

  cy.wait('@formPage')
  cy.contains('click button').as('clickMe')
  cy.get('@clickMe').should('be.visible')
  cy.get('input')
  cy.then(() => {
    object.foo()
  }).then(() => {
    expect(spy).to.be.called
  })
})
