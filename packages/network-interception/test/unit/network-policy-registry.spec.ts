import { describe, it, expect, vi } from 'vitest'
import { NetworkPolicyRegistry, BlockedHosts } from '../../lib'

describe('NetworkPolicyRegistry', () => {
  it('registers and returns policies in insertion order', () => {
    const registry = new NetworkPolicyRegistry()
    const policy = BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: (url) => (url.includes('evil.com') ? 'evil.com' : false),
    })

    registry.add(policy)

    expect(registry.getPolicies()).toEqual([policy])
  })

  it('runPolicies calls onEnd when a matching policy ends the chain', async () => {
    const registry = new NetworkPolicyRegistry()
    const onContinue = vi.fn()
    const onEnd = vi.fn()

    registry.add(BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: () => 'evil.com',
    }))

    await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://evil.com/' },
      onContinue,
      onEnd,
    })

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(onContinue).not.toHaveBeenCalled()
  })

  it('runPolicies returns blockedHostMatch in state when blocked', async () => {
    const registry = new NetworkPolicyRegistry()

    registry.add(BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: () => 'evil.com',
    }))

    const result = await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://evil.com/' },
    })

    expect(result.ended).toBe(true)
    expect(result.state.blockedHostMatch).toBe('evil.com')
  })

  it('runPolicies calls onContinue when no policy matches', async () => {
    const registry = new NetworkPolicyRegistry()
    const onContinue = vi.fn()
    const onEnd = vi.fn()

    registry.add(BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: () => false,
    }))

    await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://example.com/' },
      onContinue,
      onEnd,
    })

    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(onEnd).not.toHaveBeenCalled()
  })
})

describe('BlockedHosts policy', () => {
  it('does not match without a matcher or blockHosts config', () => {
    const policy = BlockedHosts({})

    expect(policy.when({ url: 'http://evil.com/' })).toBe(false)
  })

  it('matches blocked URLs via injected matcher', () => {
    const policy = BlockedHosts({
      blockHosts: ['*.evil.com'],
      matchesBlockedHost: (url, hosts) => {
        expect(hosts).toEqual(['*.evil.com'])

        return url.includes('evil.com') ? 'evil.com' : false
      },
    })

    expect(policy.when({ url: 'http://evil.com/path' })).toBe(true)
    expect(policy.when({ url: 'http://example.com/' })).toBe(false)
  })
})
