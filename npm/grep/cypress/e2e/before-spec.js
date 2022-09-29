describe('Runs before and beforeEach when first test is skipped', () => {
  let count = 0

  before(() => {
    count++
  })

  beforeEach(() => {
    count++
  })

  it('A', { tags: ['@core'] }, () => {})

  it('B', { tags: ['@core', '@staging'] }, () => {
    expect(count).to.equal(2)
  })
})
