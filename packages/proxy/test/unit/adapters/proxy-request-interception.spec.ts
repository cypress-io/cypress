import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProxyRequestInterceptionAdapter } from '../../../lib/adapters/proxy-request-interception'
import { correlateBrowserPreRequest } from '../../../lib/adapters/correlate-browser-pre-request'
import { sendRequestOutgoing } from '../../../lib/adapters/send-request-outgoing'

vi.mock('../../../lib/adapters/correlate-browser-pre-request', () => {
  return {
    correlateBrowserPreRequest: vi.fn(),
  }
})

vi.mock('../../../lib/adapters/send-request-outgoing', () => {
  return {
    sendRequestOutgoing: vi.fn(),
  }
})

describe('ProxyRequestInterceptionAdapter', () => {
  beforeEach(() => {
    vi.mocked(correlateBrowserPreRequest).mockReset()
    vi.mocked(sendRequestOutgoing).mockReset()
  })

  it('delegates correlateBrowserPreRequest to correlateBrowserPreRequest helper', async () => {
    const adapter = new ProxyRequestInterceptionAdapter()
    const ctx = { next: vi.fn() }

    vi.mocked(correlateBrowserPreRequest).mockResolvedValue(undefined)

    await adapter.correlateBrowserPreRequest(ctx)

    expect(correlateBrowserPreRequest).toHaveBeenCalledOnce()
    expect(correlateBrowserPreRequest).toHaveBeenCalledWith(ctx)
  })

  it('delegates forwardToOrigin to sendRequestOutgoing helper', () => {
    const adapter = new ProxyRequestInterceptionAdapter()
    const ctx = { req: { proxiedUrl: 'http://example.com' } }

    adapter.forwardToOrigin(ctx)

    expect(sendRequestOutgoing).toHaveBeenCalledOnce()
    expect(sendRequestOutgoing).toHaveBeenCalledWith(ctx)
  })
})
