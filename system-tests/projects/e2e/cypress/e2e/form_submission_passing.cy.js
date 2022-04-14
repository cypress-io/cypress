/* eslint-disable no-undef */
describe('form submissions', () => {
  beforeEach(() => {
    cy.visit('/forms.html')
  })

  it('will find \'form success\' message by default (after retrying)', () => {
    cy.server()
    cy.route('POST', '/users', {})
    cy.get('input[name=name]').type('brian')
    cy.get('#submit').click()
    cy.get('form span').then(($span) => {
      expect($span).to.contain('form success!')
    })
  })

  it('needs an explicit should when an element is immediately found', () => {
    cy.server()
    cy.route('POST', '/users', {})
    cy.get('input[name=name]').type('brian')
    cy.get('#submit').click()
    cy.get('form').should(($form) => {
      expect($form).to.contain('form success!')
    })
  })
})
