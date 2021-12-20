// used for testing the spec list
describe('inline-spec-list', () => {
  const randomId = (Math.random() * 10000).toFixed(0)

  it(`bar (random_id=${randomId})`, () => {
    expect('bar').to.eq('bar')
  })
})
