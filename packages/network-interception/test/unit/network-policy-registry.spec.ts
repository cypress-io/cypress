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

  it('runPolicies stops the chain at the first policy that ends it', async () => {
    const registry = new NetworkPolicyRegistry()
    const laterApply = vi.fn()

    registry.add(testPolicy({
      when: () => true,
      apply: (ctx) => ctx.end(),
    }))

    registry.add(testPolicy({
      when: () => true,
      apply: laterApply,
    }))

    const result = await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://evil.com/' },
    })

    expect(result.ended).toBe(true)
    expect(laterApply).not.toHaveBeenCalled()
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

  it('runPolicies does not end the chain when no policy matches', async () => {
    const registry = new NetworkPolicyRegistry()
    const apply = vi.fn()

    registry.add(testPolicy({
      when: () => false,
      apply,
    }))

    const result = await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://example.com/' },
    })

    expect(result.ended).toBe(false)
    expect(apply).not.toHaveBeenCalled()
  })

  it('runPolicies skips policies registered for another phase', async () => {
    const registry = new NetworkPolicyRegistry()
    const apply = vi.fn()

    registry.add(testPolicy({
      phases: ['response'],
      when: () => true,
      apply,
    }))

    const result = await registry.runPolicies({
      phase: 'request',
      exchange: { url: 'http://example.com/' },
    })

    expect(result.ended).toBe(false)
    expect(apply).not.toHaveBeenCalled()
  })
})
