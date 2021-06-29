// used for testing the spec list
describe('inline-spec-list', () => {
  const randomId = (Math.random() * 10000).toFixed(0)

  it(`foo (random_id=${randomId})`, () => {
    expect('foo').to.eq('foo')
  })
})
