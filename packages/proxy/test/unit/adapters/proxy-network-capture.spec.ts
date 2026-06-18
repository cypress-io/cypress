import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProxyNetworkServices } from '../../../lib/adapters/create-proxy-network-services'
import { notifyResponseEndedWithEmptyBody, notifyResponseStreamReceived } from '../../../lib/adapters/network-capture'

vi.mock('../../../lib/adapters/network-capture', () => {
  return {
    notifyResponseStreamReceived: vi.fn(),
    notifyResponseEndedWithEmptyBody: vi.fn(),
  }
})

describe('createProxyNetworkServices networkCapture', () => {
  beforeEach(() => {
    vi.mocked(notifyResponseStreamReceived).mockReset()
    vi.mocked(notifyResponseEndedWithEmptyBody).mockReset()
  })

  it('delegates notifyResponseStreamReceived to helper', async () => {
    const services = createProxyNetworkServices()
    const ctx = { req: { requestId: '1' } }

    vi.mocked(notifyResponseStreamReceived).mockResolvedValue(undefined)

    await services.networkCapture.notifyResponseStreamReceived(ctx)

    expect(notifyResponseStreamReceived).toHaveBeenCalledWith(ctx)
  })

  it('delegates notifyResponseEndedWithEmptyBody to helper', () => {
    const services = createProxyNetworkServices()
    const ctx = { req: { requestId: '1' } }

    services.networkCapture.notifyResponseEndedWithEmptyBody(ctx, { isCached: true })

    expect(notifyResponseEndedWithEmptyBody).toHaveBeenCalledWith(ctx, { isCached: true })
  })
})
