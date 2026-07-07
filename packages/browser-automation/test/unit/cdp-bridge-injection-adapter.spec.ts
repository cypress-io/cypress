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

// NOTE: @packages/network-tools is used for real — DocumentDomainInjection is pure, isomorphic logic,
// so the adapter's origin-reduction / re-register keying is exercised against the actual behavior.
import { CdpBridgeInjectionAdapter } from '../../lib/adapters/cdp-bridge-injection-adapter'

// document.domain injection on → superdomain-reduced origin keys
const documentDomainConfig = { injectDocumentDomain: true, testingType: 'e2e' as const }
// injection off → exact-origin keys
const originOnlyConfig = { injectDocumentDomain: false, testingType: 'e2e' as const }

const crossOriginConfig = {
  shouldInjectDocumentDomain: true,
  modifyObstructiveThirdPartyCode: false,
  modifyObstructiveCode: true,
  simulatedCookies: [],
}

const PRIMARY_ORIGIN = 'https://app.example.com'

// a send stub: hands out incrementing identifiers for each registered script, records removes,
// and optionally captures the registered source.
const makeSend = (onSource?: (source: string) => void) => {
  let n = 0

  return vi.fn(async (command: string, params: any) => {
    if (command === 'Page.addScriptToEvaluateOnNewDocument') {
      onSource?.(params.source)
      n += 1

      return { identifier: `script-${n}` }
    }

    return {}
  })
}

const addCalls = (send: any) => send.mock.calls.filter(([c]: [string]) => c === 'Page.addScriptToEvaluateOnNewDocument')
const removeCalls = (send: any) => send.mock.calls.filter(([c]: [string]) => c === 'Page.removeScriptToEvaluateOnNewDocument')

describe('CdpBridgeInjectionAdapter', () => {
  describe('register / re-register lifecycle', () => {
    it('registers once for the same primary origin', async () => {
      const send = makeSend()
      const adapter = new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig)

      await adapter.inject(PRIMARY_ORIGIN)
      await adapter.inject(PRIMARY_ORIGIN)

      expect(addCalls(send)).toHaveLength(1)
      expect(removeCalls(send)).toHaveLength(0)
    })

    it('re-registers (detach + attach) with the new origin when the primary origin changes', async () => {
      const sources: string[] = []
      const send = makeSend((s) => sources.push(s))
      const adapter = new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig)

      await adapter.inject('https://app.foobar.com')
      await adapter.inject('https://app.example.com')

      // detaches the first script (by its identifier), then registers a second
      expect(removeCalls(send)).toEqual([['Page.removeScriptToEvaluateOnNewDocument', { identifier: 'script-1' }]])
      expect(addCalls(send)).toHaveLength(2)

      // detach happens BEFORE the re-attach, so the stale script never overlaps the new one
      expect(send.mock.calls.map(([c]: [string]) => c)).toEqual([
        'Page.addScriptToEvaluateOnNewDocument',
        'Page.removeScriptToEvaluateOnNewDocument',
        'Page.addScriptToEvaluateOnNewDocument',
      ])

      // the re-registered script bakes in the NEW primary origin, not the stale one
      expect(sources[1]).toContain(JSON.stringify('https://app.example.com'))
      expect(sources[1]).not.toContain(JSON.stringify('https://app.foobar.com'))
    })

    it('does not re-register for a different subdomain of the same superdomain when document.domain injection is on', async () => {
      const send = makeSend()
      const adapter = new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig)

      // both reduce to the foobar.com superdomain under DocumentDomainBehavior
      await adapter.inject('https://app.foobar.com')
      await adapter.inject('https://www.foobar.com')

      expect(addCalls(send)).toHaveLength(1)
      expect(removeCalls(send)).toHaveLength(0)
    })

    it('re-registers for a different subdomain when document.domain injection is off', async () => {
      const send = makeSend()
      const adapter = new CdpBridgeInjectionAdapter(send as any, originOnlyConfig, crossOriginConfig)

      // OriginBehavior keeps the exact origins distinct
      await adapter.inject('https://app.foobar.com')
      await adapter.inject('https://www.foobar.com')

      expect(addCalls(send)).toHaveLength(2)
      expect(removeCalls(send)).toHaveLength(1)
    })

    it('throws when the primary origin cannot be parsed (never silently skips)', async () => {
      const send = makeSend()
      const adapter = new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig)

      await expect(adapter.inject('')).rejects.toThrow(/could not resolve the primary origin/i)

      expect(addCalls(send)).toHaveLength(0)
    })
  })

  describe('registered source', () => {
    let source = ''

    beforeEach(async () => {
      source = ''

      const send = makeSend((s) => {
        source = s
      })

      await new CdpBridgeInjectionAdapter(send as any, documentDomainConfig, crossOriginConfig).inject(PRIMARY_ORIGIN)
    })

    it('embeds the injection bundle inside a self-invoking closure', () => {
      expect(source.trimStart().startsWith(';(function ()')).toBe(true)
      expect(source).toContain('/* AUT_INJECTION_BUNDLE */')
    })

    it('calls injectAutBridge with the primary origin, serialized config, and runner sources', () => {
      expect(source).toContain('CypressInjection.injectAutBridge(')
      expect(source).toContain(JSON.stringify(PRIMARY_ORIGIN))
      expect(source).toContain(JSON.stringify(documentDomainConfig))
      expect(source).toContain(JSON.stringify(crossOriginConfig))
      expect(source).toContain('/* FULL_RUNNER */')
      expect(source).toContain('/* CROSS_RUNNER */')
    })

    it('passes the args in (primaryOrigin, documentDomainConfig, full, crossOriginConfig, cross) order', () => {
      const call = source.slice(source.indexOf('CypressInjection.injectAutBridge('))

      const primaryOriginAt = call.indexOf(JSON.stringify(PRIMARY_ORIGIN))
      const documentDomainConfigAt = call.indexOf(JSON.stringify(documentDomainConfig))
      const fullAt = call.indexOf('/* FULL_RUNNER */')
      const crossOriginConfigAt = call.indexOf(JSON.stringify(crossOriginConfig))
      const crossAt = call.indexOf('/* CROSS_RUNNER */')

      expect(primaryOriginAt).toBeLessThan(documentDomainConfigAt)
      expect(documentDomainConfigAt).toBeLessThan(fullAt)
      expect(fullAt).toBeLessThan(crossOriginConfigAt)
      expect(crossOriginConfigAt).toBeLessThan(crossAt)
    })

    it('produces a syntactically valid script', () => {
      expect(() => new Function(source)).not.toThrow()
    })
  })
})
