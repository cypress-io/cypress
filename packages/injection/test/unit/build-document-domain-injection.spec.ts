import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// hoisted so the vi.mock factory can reference these (vi.mock is hoisted above imports)
const { shouldInjectDocumentDomain, getHostname, injectionBehavior } = vi.hoisted(() => {
  const shouldInjectDocumentDomain = vi.fn()
  const getHostname = vi.fn()

  return { shouldInjectDocumentDomain, getHostname, injectionBehavior: { shouldInjectDocumentDomain, getHostname } }
})

// the superdomain math is network-tools' concern (tested there); here we only verify this module
// builds the behavior from config and sets document.domain when the behavior says to.
vi.mock('@packages/network-tools', () => {
  return {
    DocumentDomainInjection: {
      InjectionBehavior: vi.fn(() => injectionBehavior),
    },
  }
})

import { buildDocumentDomainInjection } from '../../lib/build-document-domain-injection'
import { DocumentDomainInjection } from '@packages/network-tools'

describe('buildDocumentDomainInjection', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    ;(globalThis as any).window = {
      location: { href: 'https://www.example.com/some/path' },
      document: { domain: 'www.example.com' },
    }
  })

  afterEach(() => {
    delete (globalThis as any).window
  })

  it('builds the injection behavior from the provided config', () => {
    shouldInjectDocumentDomain.mockReturnValue(false)

    const config = { injectDocumentDomain: true, testingType: 'e2e' } as const

    buildDocumentDomainInjection(config)

    expect(DocumentDomainInjection.InjectionBehavior).toHaveBeenCalledWith(config)
  })

  it('sets document.domain to the behavior hostname when injection is wanted', () => {
    shouldInjectDocumentDomain.mockReturnValue(true)
    getHostname.mockReturnValue('example.com')

    buildDocumentDomainInjection({ injectDocumentDomain: true, testingType: 'e2e' })

    expect(shouldInjectDocumentDomain).toHaveBeenCalledWith('https://www.example.com/some/path')
    expect(getHostname).toHaveBeenCalledWith('https://www.example.com/some/path')
    expect((globalThis as any).window.document.domain).toEqual('example.com')
  })

  it('leaves document.domain untouched when injection is not wanted', () => {
    shouldInjectDocumentDomain.mockReturnValue(false)

    buildDocumentDomainInjection({ injectDocumentDomain: false })

    expect(getHostname).not.toHaveBeenCalled()
    expect((globalThis as any).window.document.domain).toEqual('www.example.com')
  })
})
