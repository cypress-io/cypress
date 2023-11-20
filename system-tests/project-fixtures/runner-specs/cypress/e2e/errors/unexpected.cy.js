describe('unexpected errors', { defaultCommandTimeout: 0 }, () => {
  let originalIsSpecialKeyword
  let originalCyExpect

  beforeEach(() => {
    originalIsSpecialKeyword = Cypress.LocalStorage._isSpecialKeyword
    originalCyExpect = cy.expect
  })

  afterEach(() => {
    Cypress.LocalStorage._isSpecialKeyword = originalIsSpecialKeyword
    cy.expect = originalCyExpect
  })

  it('Cypress method error', () => {
    window.eval('Cypress.LocalStorage.clear = () => { throw new Error("thrown in Cypress-LocalStorage-clear") }')

    Cypress.LocalStorage.clear()
  })

  it('internal cy error', () => {
    window.eval('cy.expect = () => { throw new Error("thrown in cy-expect")}')

    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  })
})
