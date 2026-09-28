import { describe, it, expect } from 'vitest'
import { ConfiguratorNetworkPolicyAdapter } from '../../../lib/adapters/configurator-network-policy'
import { createBlockedHosts } from '@packages/network-interception'

describe('lib/adapters/configurator-network-policy', () => {
  it('delegates add and getPolicies to the underlying registry', () => {
    const adapter = new ConfiguratorNetworkPolicyAdapter()
    const policy = createBlockedHosts({
      config: { blockHosts: ['*.blocked.com'] },
      matchesBlockedHost: () => 'blocked.com',
    })

    adapter.add(policy)

    expect(adapter.getPolicies()).toEqual([policy])
  })
})
