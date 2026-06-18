import { describe, it, expect, vi } from 'vitest'
import type { NetworkPolicy } from '../../lib'
import { createBlockedHosts, NetworkPolicyRegistry } from '../../lib'

function testPolicy (overrides: Partial<NetworkPolicy> & Pick<NetworkPolicy, 'when' | 'apply'>): NetworkPolicy {
  return {
    name: 'test-policy',
    provenance: 'config',
    phases: ['request'],
    ...overrides,
  }
}

describe('NetworkPolicyRegistry', () => {
  it('registers and returns policies in insertion order', () => {
    const registry = new NetworkPolicyRegistry()
    const policy = testPolicy({
      when: () => true,
      apply: () => {},
    })

    registry.add(policy)

    expect(registry.getPolicies()).toEqual([policy])
  })

  it('runPolicies calls onEnd when a matching policy ends the chain', async () => {
    const registry = new NetworkPolicyRegistry()
    const onContinue = vi.fn()
    const onEnd = vi.fn()

    registry.add(testPolicy({
      when: () => true,
      apply: (ctx) => ctx.end(),
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

    registry.add(createBlockedHosts({
      config: { blockHosts: ['*.evil.com'] },
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

    registry.add(testPolicy({
      when: () => false,
      apply: (ctx) => ctx.end(),
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

  it('runPolicies calls onEnd only once when a policy calls end() multiple times', async () => {
    const registry = new NetworkPolicyRegistry()
    const onContinue = vi.fn()
    const onEnd = vi.fn()

    registry.add(testPolicy({
      when: () => true,
      apply: async (ctx) => {
        ctx.end()
        ctx.end()
      },
    }))

    await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://example.com/' },
      onContinue,
      onEnd,
    })

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(onContinue).not.toHaveBeenCalled()
  })
})
