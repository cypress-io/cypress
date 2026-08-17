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

  // resBodySkipped rides along in production (the transport only arms for the
  // stream disposition, which is what sets the skip marker) — carrying both
  // flags here pins the branch ORDER: the capture branch must win over the
  // skipped early-return, or stream bodies silently go back to unrecorded.
  it('notifies from the capture stream when present, leaving incomingResStream untouched', async () => {
    const notifyResponseStreamReceived = await importActualNotifyResponseStreamReceived()
    const captureStream = { on: vi.fn(), once: vi.fn(), resume: vi.fn() } as any

    captureStream.on.mockReturnValue(captureStream)
    captureStream.once.mockReturnValue(captureStream)

    const teeStream = { on: vi.fn(), once: vi.fn(), resume: vi.fn() } as any

    teeStream.on.mockReturnValue(teeStream)
    teeStream.once.mockReturnValue(teeStream)

    const responseStreamReceived = vi.fn().mockReturnValue(teeStream)
    const incomingResStream = {} as any
    const mw: any = {
      resCaptureStream: captureStream,
      resBodySkipped: true,
      protocolManager: { responseStreamReceived },
      req: { browserPreRequest: { requestId: '1' } },
      incomingRes: { headers: {} },
      incomingResStream,
      debug: vi.fn(),
      onError: vi.fn(),
      next: vi.fn(),
    }

    await notifyResponseStreamReceived(mw)

    expect(responseStreamReceived).toHaveBeenCalledOnce()

    const options = responseStreamReceived.mock.calls[0][0]

    expect(options.responseStream).toBe(captureStream)
    expect(options.isAlreadyGunzipped).toBe(true)
    expect(options.isAlreadyBrotliDecompressed).toBe(true)
    expect(options.requestId).toBe('1')

    // The middleware body path must keep its empty stand-in stream.
    expect(mw.incomingResStream).toBe(incomingResStream)

    // A capture failure must stay local (debug log), never reach mw.onError —
    // the error stage would emit a spurious driver-visible request error.
    expect(teeStream.on).toHaveBeenCalledWith('error', expect.any(Function))
    expect(teeStream.on).not.toHaveBeenCalledWith('error', mw.onError)

    const errorHandler = teeStream.on.mock.calls.find(([event]: [string]) => event === 'error')![1]

    errorHandler(new Error('boom'))
    expect(mw.debug).toHaveBeenCalled()
    expect(mw.onError).not.toHaveBeenCalled()

    // The span-end backstop rides the source stream's close, since a destroyed
    // source can leave the tee silent.
    expect(captureStream.once).toHaveBeenCalledWith('close', expect.any(Function))

    // The returned tee isn't consumed anywhere else on this path; it must be drained.
    expect(teeStream.resume).toHaveBeenCalledOnce()

    expect(mw.next).toHaveBeenCalledOnce()
  })

  it('drains the capture stream itself when the protocol returns no tee', async () => {
    const notifyResponseStreamReceived = await importActualNotifyResponseStreamReceived()
    const captureStream = { on: vi.fn(), once: vi.fn(), resume: vi.fn() } as any

    captureStream.on.mockReturnValue(captureStream)
    captureStream.once.mockReturnValue(captureStream)

    const responseStreamReceived = vi.fn().mockReturnValue(undefined)
    const mw: any = {
      resCaptureStream: captureStream,
      resBodySkipped: true,
      protocolManager: { responseStreamReceived },
      req: { browserPreRequest: { requestId: '1' } },
      incomingRes: { headers: {} },
      incomingResStream: {},
      debug: vi.fn(),
      onError: vi.fn(),
      next: vi.fn(),
    }

    await notifyResponseStreamReceived(mw)

    expect(responseStreamReceived).toHaveBeenCalledOnce()

    // Nothing will ever read the pump's bytes; without this drain they buffer
    // to the capture cap for every long-lived stream.
    expect(captureStream.resume).toHaveBeenCalledOnce()

    expect(mw.next).toHaveBeenCalledOnce()
  })
})
