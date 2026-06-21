import { describe, it, expect, vi, beforeEach } from 'vitest'
import { endRequestsToBlockedHosts } from '../../../lib/adapters/end-requests-to-blocked-hosts'
import type { RequestInterceptionMiddlewareCtx } from '../../../lib/adapters/types'

function createMiddlewareCtx (overrides: Partial<RequestInterceptionMiddlewareCtx> = {}) {
  const res = {
    set: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    end: vi.fn(),
  }

  return {
    config: { blockHosts: ['*.blocked.com'] },
    debug: vi.fn(),
    end: vi.fn(),
    next: vi.fn(),
    reqMiddlewareSpan: undefined,
    res,
    ...overrides,
  } as unknown as RequestInterceptionMiddlewareCtx
}

describe('endRequestsToBlockedHosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ends blocked requests with 503 and matched-host header', async () => {
    const mw = createMiddlewareCtx()
    const runPolicies = vi.fn().mockResolvedValue({
      ended: true,
      state: { blockedHostMatch: 'blocked.com' },
    })

    await endRequestsToBlockedHosts(mw, runPolicies)

    expect(mw.res.set).toHaveBeenCalledWith('x-cypress-matched-blocked-host', 'blocked.com')
    expect(mw.res.status).toHaveBeenCalledWith(503)
    expect(mw.res.end).toHaveBeenCalledOnce()
    expect(mw.end).toHaveBeenCalledOnce()
    expect(mw.next).not.toHaveBeenCalled()
    expect(mw.debug).toHaveBeenCalledWith('blocking request %o', { matches: 'blocked.com' })
  })

  it('continues when request-phase policies do not end the request', async () => {
    const mw = createMiddlewareCtx()
    const runPolicies = vi.fn().mockResolvedValue({
      ended: false,
      state: {},
    })

    await endRequestsToBlockedHosts(mw, runPolicies)

    expect(mw.next).toHaveBeenCalledOnce()
    expect(mw.end).not.toHaveBeenCalled()
    expect(mw.res.status).not.toHaveBeenCalled()
  })

  it('continues when result.ended without blockedHostMatch', async () => {
    const mw = createMiddlewareCtx()
    const runPolicies = vi.fn().mockResolvedValue({
      ended: true,
      state: {},
    })

    await endRequestsToBlockedHosts(mw, runPolicies)

    expect(mw.debug).toHaveBeenCalledWith(
      'request ended by policy without blockedHostMatch %o',
      { state: {} },
    )

    expect(mw.next).toHaveBeenCalledOnce()
    expect(mw.end).not.toHaveBeenCalled()
    expect(mw.res.status).not.toHaveBeenCalled()
    expect(mw.res.end).not.toHaveBeenCalled()
  })
})
