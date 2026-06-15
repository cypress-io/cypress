import { BlockedHosts } from '@packages/network-interception'
import '../../spec_helper'

describe('BlockedHosts policy', () => {
  it('does not match without a matcher or blockHosts config', () => {
    const policy = BlockedHosts({})

    expect(policy.when({ url: 'http://evil.com/' })).to.be.false
  })

  it('matches blocked URLs via injected matcher', () => {
    const policy = BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: (url, hosts) => {
        expect(hosts).to.deep.equal(['*.evil.com'])

        return url.includes('evil.com') ? 'evil.com' : false
      },
    })

    expect(policy.when({ url: 'http://evil.com/path' })).to.be.true
    expect(policy.when({ url: 'http://example.com/' })).to.be.false
  })
})
