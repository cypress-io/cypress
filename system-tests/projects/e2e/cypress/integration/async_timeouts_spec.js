/* eslint-disable
    mocha/handle-done-callback,
    no-undef
*/
describe('async', () => {
  it('bar fails', function (done) {
    this.timeout(100)

    cy.on('fail', () => {})

    // async caught fail
    foo.bar()
  })

  it('fails async after cypress command', function (done) {
    this.timeout(100)

    cy.wait(0)
  })
})
