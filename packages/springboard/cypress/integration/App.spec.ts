describe('App', () => {
  beforeEach(() => {
    cy.visitIndex().then((win: Window) => {
      // mount React app.
      win.App.start()
    })
  })

  it('navigates to the landing page', () => {
    cy.get('div').contains('Cypress Dashboard')
    cy.get('div').contains('Welcome! What kind of tests would you like to run?')
  })
})
