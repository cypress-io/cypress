import { createBlockedHosts } from '../../../lib/network-policies/blocked-hosts'
import '../../spec_helper'

describe('lib/network-policies/blocked-hosts', () => {
  it('does not match without a matcher or blockHosts config', () => {
    const policy = createBlockedHosts({})

    expect(policy.when({ url: 'http://evil.com/' })).to.be.false
  })

  it('matches blocked URLs via injected matcher', () => {
    const policy = createBlockedHosts({
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
