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
let testAfterRunEvent = false

Cypress.on('test:after:run', (obj) => {
  if (obj.title === 'does not run') {
    testAfterRunEvent = true
  }
})

describe('foo', () => {
  before(() => {
    setTimeout(() => {
      return foo.bar()
    }
    , 10)

    return cy.wait(1000)
  })

  it('does not run', () => {})
})

describe('bar', () => {
  it('runs', () => {
    expect(testAfterRunEvent).to.be.true
  })
})
