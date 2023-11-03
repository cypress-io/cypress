// The goal of this test is to load a page containing a target type of 'other' (e.g. embedded pdfs)
// This is to ensure that we don't hang on the cy.visit (https://github.com/cypress-io/cypress/issues/28228)
context('Test', () => {
  it('visit site with unsupported content', () => {
    cy.visit('http://localhost:1515/other_target.html')
  })
})
