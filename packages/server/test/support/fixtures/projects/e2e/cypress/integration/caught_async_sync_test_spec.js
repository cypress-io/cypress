/* eslint-disable
    brace-style,
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
describe('foo', () => {
  it('baz fails', () => // synchronous caught fail
  {
    return foo.bar()
  })

  it('bar fails', (done) => // async caught fail
  {
    return foo.bar()
  })

  it('quux fails', (done) => // commands caught never calling done
  // with no fail handler should immediately die
  {
    return cy.wrap(null).then(() => {
      return foo.bar()
    })
  })

  it('quux2 fails', (done) => {
    cy.on('fail', () => {
      return foo.bar()
    })

    // commands caught never calling done
    // but have a failing handler should die
    return cy.wrap(null).then(() => {
      return foo.bar()
    })
  })

  it('quux3 passes', (done) => {
    cy.on('fail', () => {
      return done()
    })

    // commands caught with a fail handler
    // and call done should pass
    return cy.wrap(null).then(() => {
      return foo.bar()
    })
  })

  it('quux4 passes', () => {
    cy.on('fail', () => {})

    // commands caught with a fail handler
    // and no done callback will pass if
    // nothing throws in the fail callback
    return cy.wrap(null).then(() => {
      return foo.bar()
    })
  })

  it('quux5 passes', () => {
    cy.on('fail', () => {})

    // no commands fail handler should pass
    return foo.bar()
  })

  it('quux6 passes', (done) => {
    cy.on('fail', () => {
      return done()
    })

    // no commands fail async handler should pass
    return foo.bar()
  })
})
