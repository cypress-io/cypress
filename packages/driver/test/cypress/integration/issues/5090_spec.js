describe('Cy.visit with double dots', () => {

  it('This will get rewritten to http:///?q=.. and generate an error', () => {
    cy.visit('?q=..')
  })

  it('This will get rewritten to https://www.google.com/?q=.. and work ', () => {
    cy.visit('/?q=..')
  })
})
