import { describe, it, expect, vi } from 'vitest'
import {
  createBlockedHosts,
  NetworkPolicyRegistry,
  registerDefaultNetworkPolicies,
} from '../../lib'

describe('createBlockedHosts', () => {
  it('does not match without a matcher or blockHosts config', () => {
    const policy = createBlockedHosts({ config: {} })

    expect(policy.when({ url: 'http://evil.com/' })).toBe(false)
  })

  it('matches blocked URLs via injected matcher', () => {
    const policy = createBlockedHosts({
      config: { blockHosts: ['*.evil.com'] },
      matchesBlockedHost: (url, hosts) => {
        expect(hosts).toEqual(['*.evil.com'])

        return url.includes('evil.com') ? 'evil.com' : false
      },
    })

    expect(policy.when({ url: 'http://evil.com/path' })).toBe(true)
    expect(policy.when({ url: 'http://example.com/' })).toBe(false)
  })

  it('reads blockHosts from live config at enforcement time', () => {
    const liveConfig = { blockHosts: ['*.evil.com'] as string[] | null }
    const policy = createBlockedHosts({
      config: liveConfig,
      matchesBlockedHost: (url, hosts) => {
        return hosts.includes('*.evil.com') && url.includes('evil.com') ? 'evil.com' : false
      },
    })

    expect(policy.when({ url: 'http://evil.com/' })).toBe(true)

    liveConfig.blockHosts = null
    expect(policy.when({ url: 'http://evil.com/' })).toBe(false)

    liveConfig.blockHosts = ['*.other.com']
    expect(policy.when({ url: 'http://evil.com/' })).toBe(false)
  })
})

describe('registerDefaultNetworkPolicies', () => {
  it('registers createBlockedHosts from config', () => {
    const registry = new NetworkPolicyRegistry()

    registerDefaultNetworkPolicies(registry, {
      blockHosts: ['localhost:3131'],
    }, {
      matchesBlockedHost: (url, hosts) => {
        return hosts.includes('localhost:3131') && url.includes('localhost:3131') ? 'localhost:3131' : false
      },
    })

    const [policy] = registry.getPolicies()

    expect(policy.name).toBe('blocked-hosts')
    expect(policy.provenance).toBe('config')
    expect(policy.phases).toEqual(['request'])
    expect(policy.when({ url: 'http://localhost:3131/' })).toBe(true)
    expect(policy.when({ url: 'http://example.com/' })).toBe(false)
  })

  it('uses injected matchesBlockedHost as the host matcher', () => {
    const registry = new NetworkPolicyRegistry()
    const matchesBlockedHost = vi.fn((url: string) => {
      return url.includes('localhost:3131') ? 'localhost:3131' : false
    })

    const liveConfig = { blockHosts: ['localhost:3131'] as string[] | null }

    registerDefaultNetworkPolicies(registry, liveConfig, {
      matchesBlockedHost,
    })

    const [policy] = registry.getPolicies()

    policy.when({ url: 'http://localhost:3131/' })

    expect(matchesBlockedHost).toHaveBeenCalledWith('http://localhost:3131/', ['localhost:3131'])

    liveConfig.blockHosts = null
    expect(policy.when({ url: 'http://localhost:3131/' })).toBe(false)
  })
})
