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
describe('simple failing spec', () => {
  it('fails1', () => {
    return cy.wrap(true, { timeout: 100 }).should('be.false')
  })

  it('fails2', () => {
    throw new Error('fails2')
  })
})
