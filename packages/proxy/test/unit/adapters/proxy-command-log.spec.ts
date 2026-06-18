import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProxyNetworkServices } from '../../../lib/adapters/create-proxy-network-services'
import { sendToDriver } from '../../../lib/adapters/send-to-driver'

vi.mock('../../../lib/adapters/send-to-driver', () => {
  return {
    sendToDriver: vi.fn(),
  }
})

describe('createProxyNetworkServices commandLog', () => {
  beforeEach(() => {
    vi.mocked(sendToDriver).mockReset()
  })

  it('delegates notifyIncomingRequest to sendToDriver helper', () => {
    const services = createProxyNetworkServices()
    const ctx = { req: { browserPreRequest: { requestId: '1' } } }

    services.commandLog.notifyIncomingRequest(ctx)

    expect(sendToDriver).toHaveBeenCalledWith(ctx)
  })

  it('returns undefined from logInterception on the server', () => {
    const services = createProxyNetworkServices()

    expect(services.commandLog.logInterception({ interception: {}, route: {} })).toBeUndefined()
  })

  it('is exported from the @packages/proxy barrel', async () => {
    const { createProxyNetworkServices: exportedFactory } = await import('@packages/proxy')

    expect(exportedFactory).toEqual(expect.any(Function))
    expect(exportedFactory().commandLog.notifyIncomingRequest).toEqual(expect.any(Function))
  })
})
