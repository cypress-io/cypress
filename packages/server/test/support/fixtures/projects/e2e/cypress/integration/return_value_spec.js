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
it('errors when invoking commands and return a different value', () => {
  cy.wrap(null)

  return [{}, 1, 2, 'foo', (function () {})]
})

it('errors when invoking commands in custom command and returning different value', () => {
  Cypress.Commands.add('foo', () => {
    cy.wrap(null)

    return 'bar'
  })

  return cy.foo()
})

it('errors when not invoking commands, invoking done callback, and returning a promise', (done) => {
  return Promise.resolve(null).then(() => {
    return done()
  })
})
