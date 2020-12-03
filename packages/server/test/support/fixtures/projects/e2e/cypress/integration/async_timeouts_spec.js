/* eslint-disable
    mocha/handle-done-callback,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('async', () => {
  it('bar fails', function (done) {
    this.timeout(100)

    cy.on('fail', () => {})

    // async caught fail
    return foo.bar()
  })

  it('fails async after cypress command', function (done) {
    this.timeout(100)

    return cy.wait(0)
  })
})
