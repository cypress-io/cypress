import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProxyNetworkServices } from '../../../lib/adapters/create-proxy-network-services'
import { sendToDriver } from '../../../lib/adapters/send-to-driver'
import { attachCrossOriginCookies } from '../../../lib/adapters/attach-cross-origin-cookies'
import { copyCookiesFromResponse } from '../../../lib/adapters/copy-cookies-from-response'
import { setInjectionLevel } from '../../../lib/adapters/set-injection-level'
import { injectHtml } from '../../../lib/adapters/inject-html'
import { removeSecurity } from '../../../lib/adapters/remove-security'
import { notifyResponseEndedWithEmptyBody, notifyResponseStreamReceived } from '../../../lib/adapters/network-capture'

vi.mock('../../../lib/adapters/send-to-driver', () => {
  return {
    sendToDriver: vi.fn(),
  }
})

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

vi.mock('../../../lib/adapters/set-injection-level', () => {
  return {
    setInjectionLevel: vi.fn(),
  }
})

vi.mock('../../../lib/adapters/inject-html', () => {
  return {
    injectHtml: vi.fn(),
  }
})

vi.mock('../../../lib/adapters/remove-security', () => {
  return {
    removeSecurity: vi.fn(),
  }
})

vi.mock('../../../lib/adapters/network-capture', () => {
  return {
    notifyResponseStreamReceived: vi.fn(),
    notifyResponseEndedWithEmptyBody: vi.fn(),
  }
})

describe('createProxyNetworkServices', () => {
  beforeEach(() => {
    vi.mocked(sendToDriver).mockReset()
    vi.mocked(attachCrossOriginCookies).mockReset()
    vi.mocked(copyCookiesFromResponse).mockReset()
    vi.mocked(setInjectionLevel).mockReset()
    vi.mocked(injectHtml).mockReset()
    vi.mocked(removeSecurity).mockReset()
    vi.mocked(notifyResponseStreamReceived).mockReset()
    vi.mocked(notifyResponseEndedWithEmptyBody).mockReset()
  })

  describe('commandLog', () => {
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

  describe('cookieState', () => {
    it('delegates attachCrossOriginCookies to helper', async () => {
      const services = createProxyNetworkServices()
      const ctx = { req: {} }

      vi.mocked(attachCrossOriginCookies).mockResolvedValue(undefined)

      await services.cookieState.attachCrossOriginCookies(ctx)

      expect(attachCrossOriginCookies).toHaveBeenCalledWith(ctx)
    })

    it('delegates copyCookiesFromResponse to helper', async () => {
      const services = createProxyNetworkServices()
      const ctx = { req: {} }

      vi.mocked(copyCookiesFromResponse).mockResolvedValue(undefined)

      await services.cookieState.copyCookiesFromResponse(ctx)

      expect(copyCookiesFromResponse).toHaveBeenCalledWith(ctx)
    })
  })

  describe('documentPreparation', () => {
    it('delegates setInjectionLevel to setInjectionLevel helper', async () => {
      const services = createProxyNetworkServices()
      const ctx = { res: { wantsInjection: null } }

      vi.mocked(setInjectionLevel).mockResolvedValue(undefined)

      await services.documentPreparation.setInjectionLevel(ctx)

      expect(setInjectionLevel).toHaveBeenCalledOnce()
      expect(setInjectionLevel).toHaveBeenCalledWith(ctx)
    })

    it('delegates injectHtml to injectHtml helper', async () => {
      const services = createProxyNetworkServices()
      const ctx = { res: { wantsInjection: 'full' } }

      vi.mocked(injectHtml).mockResolvedValue(undefined)

      await services.documentPreparation.injectHtml(ctx)

      expect(injectHtml).toHaveBeenCalledOnce()
      expect(injectHtml).toHaveBeenCalledWith(ctx)
    })

    it('delegates removeSecurity to removeSecurity helper', async () => {
      const services = createProxyNetworkServices()
      const ctx = { res: { wantsSecurityRemoved: true } }

      vi.mocked(removeSecurity).mockResolvedValue(undefined)

      await services.documentPreparation.removeSecurity(ctx)

      expect(removeSecurity).toHaveBeenCalledOnce()
      expect(removeSecurity).toHaveBeenCalledWith(ctx)
    })
  })

  describe('networkCapture', () => {
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
})
