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

describe('notifyResponseStreamReceived', () => {
  // The module is mocked above for the adapter delegation tests, so pull the
  // real implementation here to exercise its guard logic directly.
  async function importActualNotifyResponseStreamReceived () {
    const actual = await vi.importActual<typeof import('../../../lib/adapters/network-capture')>('../../../lib/adapters/network-capture')

    return actual.notifyResponseStreamReceived
  }

  it('skips the protocol notification when the body was deliberately not read', async () => {
    const notifyResponseStreamReceived = await importActualNotifyResponseStreamReceived()
    const responseStreamReceived = vi.fn()
    const incomingResStream = {} as any
    const mw: any = {
      resBodySkipped: true,
      protocolManager: { responseStreamReceived },
      req: { browserPreRequest: { requestId: '1' } },
      incomingResStream,
      next: vi.fn(),
    }

    await notifyResponseStreamReceived(mw)

    expect(responseStreamReceived).not.toHaveBeenCalled()
    expect(mw.next).toHaveBeenCalledOnce()
    expect(mw.incomingResStream).toBe(incomingResStream)
  })

  it('still notifies when the marker is absent', async () => {
    const notifyResponseStreamReceived = await importActualNotifyResponseStreamReceived()
    const responseStreamReceived = vi.fn().mockReturnValue(undefined)
    const mw: any = {
      protocolManager: { responseStreamReceived },
      req: { browserPreRequest: { requestId: '1' } },
      incomingRes: { headers: {} },
      incomingResStream: {},
      next: vi.fn(),
    }

    await notifyResponseStreamReceived(mw)

    expect(responseStreamReceived).toHaveBeenCalledOnce()
    expect(mw.next).toHaveBeenCalledOnce()
  })
})
