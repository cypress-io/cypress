import * as head from 'lodash/head'

describe('yarn-v3.1.1-pnp', () => {
  it('can load package from pnp runtime', () => {
    expect(head([1, 2, 3])).to.equal(1)
  })
})
