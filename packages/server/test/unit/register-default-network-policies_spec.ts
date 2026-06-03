import { blocked } from '@packages/network'
import { NetworkPolicyRegistry } from '@packages/network-interception'
import { registerDefaultNetworkPolicies } from '../../lib/register-default-network-policies'
import { createBlockedHosts } from '../../lib/network-policies/blocked-hosts'
import '../spec_helper'

describe('lib/register-default-network-policies', () => {
  it('registers blocked-hosts policy from config', () => {
    const registry = new NetworkPolicyRegistry()

    registerDefaultNetworkPolicies(registry, {
      blockHosts: ['localhost:3131'],
    })

    const [policy] = registry.getPolicies()

    expect(policy.name).to.eq('blocked-hosts')
    expect(policy.provenance).to.eq('config')
    expect(policy.phases).to.deep.equal(['request'])
    expect(policy.when({ url: 'http://localhost:3131/' })).to.be.true
    expect(policy.when({ url: 'http://example.com/' })).to.be.false
  })

  it('uses blocked.matches as the host matcher', () => {
    const registry = new NetworkPolicyRegistry()
    const matchesSpy = sinon.spy(blocked, 'matches')

    registerDefaultNetworkPolicies(registry, {
      blockHosts: ['localhost:3131'],
    })

    const [policy] = registry.getPolicies() as ReturnType<typeof createBlockedHosts>[]

    policy.when({ url: 'http://localhost:3131/' })

    expect(matchesSpy).to.have.been.calledWith('http://localhost:3131/', ['localhost:3131'])

    matchesSpy.restore()
  })
})
