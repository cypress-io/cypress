import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProxyCookieStateAdapter } from '../../../lib/adapters/proxy-cookie-state'
import { attachCrossOriginCookies } from '../../../lib/adapters/attach-cross-origin-cookies'
import { copyCookiesFromResponse } from '../../../lib/adapters/copy-cookies-from-response'

vi.mock('../../../lib/adapters/attach-cross-origin-cookies', () => {
  return {
    attachCrossOriginCookies: vi.fn(),
  }
})

vi.mock('../../../lib/adapters/copy-cookies-from-response', () => {
  return {
    copyCookiesFromResponse: vi.fn(),
  }
})

describe('ProxyCookieStateAdapter', () => {
  beforeEach(() => {
    vi.mocked(attachCrossOriginCookies).mockReset()
    vi.mocked(copyCookiesFromResponse).mockReset()
  })

  it('delegates attachCrossOriginCookies to helper', async () => {
    const adapter = new ProxyCookieStateAdapter()
    const ctx = { req: {} }

    vi.mocked(attachCrossOriginCookies).mockResolvedValue(undefined)

    await adapter.attachCrossOriginCookies(ctx)

    expect(attachCrossOriginCookies).toHaveBeenCalledWith(ctx)
  })

  it('delegates copyCookiesFromResponse to helper', async () => {
    const adapter = new ProxyCookieStateAdapter()
    const ctx = { req: {} }

    vi.mocked(copyCookiesFromResponse).mockResolvedValue(undefined)

    await adapter.copyCookiesFromResponse(ctx)

    expect(copyCookiesFromResponse).toHaveBeenCalledWith(ctx)
  })
})
