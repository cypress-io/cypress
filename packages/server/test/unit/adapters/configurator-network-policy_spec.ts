import { ConfiguratorNetworkPolicyAdapter } from '../../../lib/adapters/configurator-network-policy'
import { BlockedHosts } from '@packages/network-interception'
import '../../spec_helper'

describe('lib/adapters/configurator-network-policy', () => {
  it('delegates add and getPolicies to the underlying registry', () => {
    const adapter = new ConfiguratorNetworkPolicyAdapter()
    const policy = BlockedHosts({
      blockHosts: ['*.blocked.com'],
      matchesBlockedHost: () => 'blocked.com',
    })

    adapter.add(policy)

    expect(adapter.getPolicies()).to.deep.equal([policy])
    expect(adapter.getRegistry().getPolicies()).to.deep.equal([policy])
  })
})
