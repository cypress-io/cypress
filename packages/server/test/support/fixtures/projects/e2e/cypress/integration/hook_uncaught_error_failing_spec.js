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
// this should run
it('t1b', () => {})

// these 3 should be skipped
describe('s1b', () => {
  beforeEach(() => {
    return cy.visit('/visit_error.html')
  })

  it('t2b', () => {})
  it('t3b', () => {})

  it('t4b', () => {})
})

// these 3 should run because we override mocha's
// default handling of uncaught errors
describe('s2b', () => {
  it('t5b', () => {})
  it('t6b', () => {})

  it('t7b', () => {})
})
