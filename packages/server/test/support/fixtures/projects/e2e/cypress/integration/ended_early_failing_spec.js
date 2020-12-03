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
describe('ending early', () => {
  it('does not end early', () => {})

  it('does end early', (done) => {
    cy
    .noop({})
    .then(() => {
      return Cypress.Promise.delay(1000)
    }).noop({})
    .wrap({})

    return setTimeout(() => {
      return done()
    }
    , 500)
  })
})
