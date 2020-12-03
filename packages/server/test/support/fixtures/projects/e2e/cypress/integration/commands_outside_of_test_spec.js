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
describe('No Running Test', () => {
  it('foo', () => {
    return cy.noop()
  })

  it('bar', () => {})

  context('nested suite', () => {
    cy.viewport('iphone-6')

    return cy.get('h1')
  })
})
