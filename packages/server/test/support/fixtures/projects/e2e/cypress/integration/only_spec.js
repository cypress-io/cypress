/* eslint-disable
    mocha/no-exclusive-tests,
    mocha/no-global-tests,
    no-only-tests/no-only-tests,
*/
it('t1', () => {})
it('t2', () => {})
it('t3', () => {})

describe('s1', () => {
  it.only('t3', () => {})

  it('t4')

  it('t5', () => {})
})

describe('s2', () => {
  it('t3', () => {})
})
