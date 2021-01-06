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
describe('stdout_failing_spec', () => {
  it('passes', () => {})

  it('fails', () => {
    return cy.then(() => {
      throw new Error('foo')
    })
  })

  it('doesnt fail', () => {})

  context('failing hook', () => {
    beforeEach(() => {
      return cy.visit('/does-not-exist.html')
    })

    it('is failing', () => {})
  })

  context('passing hook', () => {
    beforeEach(() => {
      return cy.wrap({})
    })

    it('is failing', () => {
      return cy.visit('/does-not-exist.html')
    })
  })
})
