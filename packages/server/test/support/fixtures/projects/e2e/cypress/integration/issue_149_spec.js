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
it('fails', () => {
  return cy.then(() => {
    throw new Error('this should fail here')
  })
})

it('executes more commands', () => {
  return cy
  .wrap({ foo: 'bar' }).its('foo').should('eq', 'bar')
  .writeFile('foo.js', 'bar')
})
