/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('when visit times out', () => {
  it('fails timeout exceeds pageLoadTimeout', () => {
    return cy.visit('http://localhost:3434/timeout?ms=3000')
  })

  it('fails timeout exceeds timeout option', () => {
    return cy.visit('http://localhost:3434/timeout?ms=8888', { timeout: 500 })
  })
})
