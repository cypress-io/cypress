import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProxyNetworkServices } from '../../../lib/adapters/create-proxy-network-services'
import { setInjectionLevel } from '../../../lib/adapters/set-injection-level'
import { injectHtml } from '../../../lib/adapters/inject-html'
import { removeSecurity } from '../../../lib/adapters/remove-security'

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

describe('createProxyNetworkServices documentPreparation', () => {
  beforeEach(() => {
    vi.mocked(setInjectionLevel).mockReset()
    vi.mocked(injectHtml).mockReset()
    vi.mocked(removeSecurity).mockReset()
  })

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
