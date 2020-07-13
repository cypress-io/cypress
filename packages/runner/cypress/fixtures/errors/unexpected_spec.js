import './setup'

describe('unexpected errors', { defaultCommandTimeout: 0 }, () => {
  let originalIsSpecialKeyword
  let orignalCyExpect

  beforeEach(() => {
    originalIsSpecialKeyword = Cypress.LocalStorage._isSpecialKeyword
    orignalCyExpect = cy.expect
  })

  afterEach(() => {
    Cypress.LocalStorage._isSpecialKeyword = originalIsSpecialKeyword
    cy.expect = orignalCyExpect
  })

  it('Cypress method error', () => {
    Cypress.LocalStorage.setStorages({ foo: 'foo' })

    window.autWindow.eval(`Cypress.LocalStorage._isSpecialKeyword = () => { throw new Error('thrown in Cypress-LocalStorage-_isSpecialKeyword') }`)

    Cypress.LocalStorage.clear()
  })

  it('internal cy error', () => {
    window.autWindow.eval(`cy.expect = () => { throw new Error('thrown in cy-expect') }`)

    cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  })
})
