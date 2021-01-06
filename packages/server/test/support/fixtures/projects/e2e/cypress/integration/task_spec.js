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
it('throws when task returns undefined', () => {
  return cy.task('returns:undefined')
})

it('includes stack trace in error', () => {
  return cy.task('errors', 'Error thrown in task handler')
})
