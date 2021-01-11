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
Cypress._.times(Cypress.env('NUM_TESTS'), (i) => {
  it(`num: ${i + 1} makes some long tests`, () => {
    return cy.wait(Cypress.env('MS_PER_TEST'))
  })
})
