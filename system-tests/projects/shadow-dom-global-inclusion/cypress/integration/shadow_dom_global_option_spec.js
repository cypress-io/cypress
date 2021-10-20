it('relies on shadow dom global option', () => {
  cy.visit('/cypress/fixtures/shadow-dom.html')
  cy.get('.in-shadow-dom')
})

describe('some suite', () => {
  beforeEach(() => {
    cy.visit('/cypress/fixtures/shadow-dom.html')
    cy.get('.in-shadow-dom')
  })

  it('also relies on shadow dom global option', () => {
    cy.get('.shadow-host').find('.in-shadow-dom')
  })
})
