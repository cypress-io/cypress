import { ConfiguratorNetworkPolicyAdapter } from '../../../lib/adapters/configurator-network-policy'
import { createBlockedHosts } from '@packages/network-interception'
import '../../spec_helper'

describe('lib/adapters/configurator-network-policy', () => {
  it('delegates add and getPolicies to the underlying registry', () => {
    const adapter = new ConfiguratorNetworkPolicyAdapter()
    const policy = createBlockedHosts({
      config: { blockHosts: ['*.blocked.com'] },
      matchesBlockedHost: () => 'blocked.com',
    })

    adapter.add(policy)

    expect(adapter.getPolicies()).to.deep.equal([policy])
  })
})
