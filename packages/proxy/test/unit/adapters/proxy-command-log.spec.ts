import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProxyCommandLogAdapter } from '../../../lib/adapters/proxy-command-log'
import { sendToDriver } from '../../../lib/adapters/send-to-driver'

vi.mock('../../../lib/adapters/send-to-driver', () => {
  return {
    sendToDriver: vi.fn(),
  }
})

describe('ProxyCommandLogAdapter', () => {
  beforeEach(() => {
    vi.mocked(sendToDriver).mockReset()
  })

  it('delegates notifyIncomingRequest to sendToDriver helper', () => {
    const adapter = new ProxyCommandLogAdapter()
    const ctx = { req: { browserPreRequest: { requestId: '1' } } }

    adapter.notifyIncomingRequest(ctx)

    expect(sendToDriver).toHaveBeenCalledWith(ctx)
  })

  it('returns undefined from logInterception on the server', () => {
    const adapter = new ProxyCommandLogAdapter()

    expect(adapter.logInterception({ interception: {}, route: {} })).toBeUndefined()
  })

  it('is exported from the @packages/proxy barrel', async () => {
    const { ProxyCommandLogAdapter: exportedAdapter } = await import('@packages/proxy')

    expect(exportedAdapter).toEqual(expect.any(Function))
    expect(exportedAdapter.name).toBe('ProxyCommandLogAdapter')
    expect(new exportedAdapter().notifyIncomingRequest).toEqual(expect.any(Function))
  })
})
