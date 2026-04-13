import semver from 'semver'

describe('yarn-v3.1.1-pnp', () => {
  it('can load package from pnp runtime', () => {
    expect(semver.valid('1.2.3')).to.equal('1.2.3')
  })
})
