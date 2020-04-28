import add from './add'

describe('add', () => {
  it('testing addition2', () => {
    const actual = add(2, 2)
    expect(actual).to.equal(4)
  })
})
