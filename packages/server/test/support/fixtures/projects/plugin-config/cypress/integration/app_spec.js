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
it('overrides config', () => {
  // overrides come from plugins
  expect(Cypress.config('defaultCommandTimeout')).to.eq(500)
  expect(Cypress.config('videoCompression')).to.eq(20)

  // overrides come from CLI
  expect(Cypress.config('pageLoadTimeout')).to.eq(10000)
})

it('overrides env', () => {
  // overrides come from plugins
  expect(Cypress.env('foo')).to.eq('bar')

  // overrides come from CLI
  expect(Cypress.env('bar')).to.eq('bar')
})
