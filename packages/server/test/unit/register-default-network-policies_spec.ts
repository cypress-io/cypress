import { blocked } from '@packages/network'
import { BlockedHosts } from '@packages/network-policy'
import { NetworkPolicyRegistry } from '@packages/network-policy'
import { registerDefaultNetworkPolicies } from '../../lib/register-default-network-policies'
import '../spec_helper'

describe('lib/register-default-network-policies', () => {
  it('registers BlockedHosts from config', () => {
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

    const [policy] = registry.getPolicies() as ReturnType<typeof BlockedHosts>[]

    policy.when({ url: 'http://localhost:3131/' })

    expect(matchesSpy).to.have.been.calledWith('http://localhost:3131/', ['localhost:3131'])

    matchesSpy.restore()
  })
})
