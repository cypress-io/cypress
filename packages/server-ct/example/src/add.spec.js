import add from './add'

describe('add', () => {
  it('adds two numbers together', () => {
    expect(add(1, 1)).to.eq(2)
  })
})
