/* eslint-disable
    mocha/no-global-tests,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
beforeEach(() => {
  return cy.visit('/index.html')
})

it('fails', () => {
  return cy.get('element_does_not_exist', { timeout: 200 })
})

it('should be able to log', () => {
  return cy.get('body').should('contain', 'hi')
})
