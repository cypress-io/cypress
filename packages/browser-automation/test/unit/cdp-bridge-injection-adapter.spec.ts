import { describe, it, expect, vi, beforeEach } from 'vitest'

// the injection package ships the page-context bundle as a default-exported string; stub it so we
// can assert it gets embedded without depending on a built dist.
vi.mock('@packages/injection', () => {
  return { default: '/* AUT_INJECTION_BUNDLE */' }
})

// the runner sources are read off disk via resolve-dist; stub them with recognizable markers.
vi.mock('@packages/resolve-dist', () => {
  return {
    getRunnerInjectionContents: async () => Buffer.from('/* FULL_RUNNER */'),
    getRunnerCrossOriginInjectionContents: async () => Buffer.from('/* CROSS_RUNNER */'),
  }
})

import { CdpBridgeInjectionAdapter } from '../../lib/adapters/cdp-bridge-injection-adapter'

const documentDomainConfig = { injectDocumentDomain: true, testingType: 'e2e' as const }
const crossOriginConfig = {
  shouldInjectDocumentDomain: true,
  modifyObstructiveThirdPartyCode: false,
  modifyObstructiveCode: true,
  simulatedCookies: [],
}

// a send stub that satisfies the bridge's addScriptToEvaluateOnNewDocument identifier read, and
// captures the registered source when asked.
const makeSend = (onSource?: (source: string) => void) => {
  return vi.fn(async (command: string, params: any) => {
    if (command === 'Page.addScriptToEvaluateOnNewDocument') {
      onSource?.(params.source)

      return { identifier: 'script-1' }
    }

    return {}
  })
}

describe('CdpBridgeInjectionAdapter', () => {
  it('registers the bridge once (register-once guard)', async () => {
    const send = makeSend()
    const adapter = new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig)

    await adapter.inject()
    await adapter.inject()

    const addCalls = send.mock.calls.filter(([command]) => command === 'Page.addScriptToEvaluateOnNewDocument')

    expect(addCalls).toHaveLength(1)
  })

  describe('registered source', () => {
    let source = ''

    beforeEach(async () => {
      source = ''

      const send = makeSend((s) => {
        source = s
      })

      await new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig).inject()
    })

    it('embeds the injection bundle inside a self-invoking closure', () => {
      expect(source.trimStart().startsWith(';(function ()')).toBe(true)
      expect(source).toContain('/* AUT_INJECTION_BUNDLE */')
    })

    it('calls injectAutBridge with the serialized config + runner sources', () => {
      expect(source).toContain('CypressInjection.injectAutBridge(')
      expect(source).toContain(JSON.stringify(documentDomainConfig))
      expect(source).toContain(JSON.stringify(crossOriginConfig))
      expect(source).toContain('/* FULL_RUNNER */')
      expect(source).toContain('/* CROSS_RUNNER */')
    })

    it('passes the args in (documentDomainConfig, full, crossOriginConfig, cross) order', () => {
      const call = source.slice(source.indexOf('CypressInjection.injectAutBridge('))

      const documentDomainConfigAt = call.indexOf(JSON.stringify(documentDomainConfig))
      const fullAt = call.indexOf('/* FULL_RUNNER */')
      const crossOriginConfigAt = call.indexOf(JSON.stringify(crossOriginConfig))
      const crossAt = call.indexOf('/* CROSS_RUNNER */')

      expect(documentDomainConfigAt).toBeLessThan(fullAt)
      expect(fullAt).toBeLessThan(crossOriginConfigAt)
      expect(crossOriginConfigAt).toBeLessThan(crossAt)
    })

    it('produces a syntactically valid script', () => {
      expect(() => new Function(source)).not.toThrow()
    })
  })
})
