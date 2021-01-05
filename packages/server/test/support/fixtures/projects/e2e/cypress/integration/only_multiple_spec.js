/* eslint-disable
    mocha/no-exclusive-tests,
    mocha/no-global-tests,
    no-only-tests/no-only-tests,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
it('t1', () => {})
it('t2', () => {})
it('t3', () => {})

describe('s1', () => {
  it.only('t3', () => {})

  it.only('t4')

  it('t5', () => {})
})

describe('s2', () => {
  it('t3', () => {})
})
