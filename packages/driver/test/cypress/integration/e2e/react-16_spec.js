// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('react v16.0.0', () => {
  return context('fires onChange events', () => {
    beforeEach(() => cy.visit('/fixtures/react-16.html'))

    it('input', () => {
      return cy
      .get('#react-container input[type=text]').type('foo').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })

    it('email', () => {
      return cy
      .get('#react-container input[type=email]').type('foo').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })

    return it('number', () => {
      return cy
      .get('#react-container input[type=number]').type('123').blur()
      .window().its('onChangeEvents').should('eq', 3)
    })
  })
})
