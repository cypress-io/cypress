/* eslint-disable no-undef */
describe('form submission fails', () => {
  beforeEach(() => {
    cy.visit('/forms.html')
  })

  it('fails without an explicit wait when an element is immediately found', () => {
    cy.server()
    cy.route('POST', '/users', {})
    cy.get('input[name=name]').type('brian')
    cy.get('#submit').click()
    cy.get('form').then(($form) => {
      expect($form).to.contain('form success!')
    })
  })
})
