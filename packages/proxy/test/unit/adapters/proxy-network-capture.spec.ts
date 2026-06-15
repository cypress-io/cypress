import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProxyNetworkCaptureAdapter } from '../../../lib/adapters/proxy-network-capture'
import { notifyResponseEndedWithEmptyBody, notifyResponseStreamReceived } from '../../../lib/adapters/network-capture'

vi.mock('../../../lib/adapters/network-capture', () => {
  return {
    notifyResponseStreamReceived: vi.fn(),
    notifyResponseEndedWithEmptyBody: vi.fn(),
  }
})

describe('ProxyNetworkCaptureAdapter', () => {
  beforeEach(() => {
    vi.mocked(notifyResponseStreamReceived).mockReset()
    vi.mocked(notifyResponseEndedWithEmptyBody).mockReset()
  })

  it('delegates notifyResponseStreamReceived to helper', async () => {
    const adapter = new ProxyNetworkCaptureAdapter()
    const ctx = { req: { requestId: '1' } }

    vi.mocked(notifyResponseStreamReceived).mockResolvedValue(undefined)

    await adapter.notifyResponseStreamReceived(ctx)

    expect(notifyResponseStreamReceived).toHaveBeenCalledWith(ctx)
  })

  it('delegates notifyResponseEndedWithEmptyBody to helper', () => {
    const adapter = new ProxyNetworkCaptureAdapter()
    const ctx = { req: { requestId: '1' } }

    adapter.notifyResponseEndedWithEmptyBody(ctx, { isCached: true })

    expect(notifyResponseEndedWithEmptyBody).toHaveBeenCalledWith(ctx, { isCached: true })
  })
})
