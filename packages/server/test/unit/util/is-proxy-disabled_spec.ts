require('../../spec_helper')

const { isProxyDisabled } = require('../../../lib/util/is-proxy-disabled')

describe('lib/util/is-proxy-disabled', () => {
  afterEach(() => {
    delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
  })

  it('returns false by default', () => {
    expect(isProxyDisabled()).to.be.false
  })

  it('returns true when CYPRESS_INTERNAL_DISABLE_PROXY=1', () => {
    process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'

    expect(isProxyDisabled()).to.be.true
  })

  it('returns false for other values', () => {
    process.env.CYPRESS_INTERNAL_DISABLE_PROXY = 'true'

    expect(isProxyDisabled()).to.be.false
  })
})
