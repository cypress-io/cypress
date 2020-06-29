import './setup'

describe('assertion failures', () => {
  it('with expect().<foo>', () => {
    expect('actual').to.equal('expected')
  })

  it('with assert()', () => {
    assert(false, 'should be true')
  })

  it('with assert.<foo>()', () => {
    assert.equal('actual', 'expected')
  })
})
