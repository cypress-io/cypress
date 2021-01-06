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
describe('simple passing spec', () => {
  beforeEach(() => {
    return cy.wait(1000)
  })

  it('passes', () => {
    return cy.wrap(true).should('be.true')
  })
})
