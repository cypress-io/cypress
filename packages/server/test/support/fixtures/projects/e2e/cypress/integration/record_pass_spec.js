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
describe('record pass', () => {
  it('passes', () => {
    cy.visit('/scrollable.html')

    return cy
    .viewport(400, 400)
    .get('#box')
    .screenshot('yay it passes')
  })

  it('is pending')
})
