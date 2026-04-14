import head from 'lodash/head'

describe('yarn v3.2 PnP', () => {
  it('can load package from pnp runtime', () => {
    expect(head([1, 2, 3])).to.equal(1)
  })
})
