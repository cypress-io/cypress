import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { injectAutBridge } from '../../lib/index'
import { AUT_FRAME_NAME_IDENTIFIER } from '@packages/types'

// A true integration test: nothing here is mocked. injectAutBridge runs the real
// DocumentDomainInjection, the real installAutBridgeInFrame, and the real resolveAutInjectionLevel,
// then dispatches to its own handlers (which eval the injection contents). The only stand-in is
// `window` itself — the browser global these run against — which we shape per test to steer the
// frame to a given injection level.
const setWindow = ({
  name = `${AUT_FRAME_NAME_IDENTIFIER} proj`,
  origin = 'https://app.example.com',
  href = undefined as string | undefined,
  domain = 'app.example.com',
}: { name?: string, origin?: string, href?: string, domain?: string } = {}) => {
  const win: any = {
    name,
    location: { origin, href: href ?? `${origin}/some/path` },
    document: { domain },
    frameElement: null,
  }

  // a distinct object so `win === win.top` is false — i.e. this is a child (AUT) frame, not the top
  win.top = {}

  ;(globalThis as any).window = win

  return win
}

describe('injectAutBridge', () => {
  beforeEach(() => {
    setWindow()
  })

  afterEach(() => {
    delete (globalThis as any).window
    delete (globalThis as any).__injectionProbe
  })

  describe('document.domain', () => {
    it('sets document.domain to the superdomain when the config injects document.domain', () => {
      injectAutBridge('https://app.example.com', { injectDocumentDomain: true, testingType: 'e2e' }, '', {
        shouldInjectDocumentDomain: true,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      // DocumentDomainBehavior reduces the frame href to its superdomain
      expect((globalThis as any).window.document.domain).toEqual('example.com')
    })

    it('leaves document.domain untouched when the config does not inject document.domain', () => {
      injectAutBridge('https://app.example.com', { injectDocumentDomain: false, testingType: 'e2e' }, '', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).window.document.domain).toEqual('app.example.com')
    })

    it('leaves document.domain untouched in a cross-superdomain (third-party) frame', () => {
      // the proxy's partial injection only applies to documents on the primary superdomain — a
      // third-party frame must not have its document.domain relaxed
      setWindow({ name: 'some-third-party-frame', origin: 'https://ads.thirdparty.com', domain: 'ads.thirdparty.com' })

      injectAutBridge('https://app.example.com', { injectDocumentDomain: true, testingType: 'e2e' }, '', {
        shouldInjectDocumentDomain: true,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).window.document.domain).toEqual('ads.thirdparty.com')
    })

    it('skips document.domain on the initial about:blank document but still runs full injection', () => {
      // about:blank has no hostname (assigning document.domain = '' throws in the browser), and
      // that failure must not prevent the bridge install on the initial AUT document
      setWindow({ origin: 'null', href: 'about:blank', domain: '' })

      injectAutBridge('https://app.example.com', { injectDocumentDomain: true, testingType: 'e2e' }, 'globalThis.__injectionProbe = "full-ran"', {
        shouldInjectDocumentDomain: true,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).window.document.domain).toEqual('')
      expect((globalThis as any).__injectionProbe).toEqual('full-ran')
    })
  })

  describe('full injection', () => {
    it('evals the full injection contents in an AUT frame whose origin matches the primary origin', () => {
      // AUT frame (window.name), origin === primaryOrigin → resolves to full
      setWindow({ origin: 'https://app.example.com' })

      injectAutBridge('https://app.example.com', { injectDocumentDomain: false, testingType: 'e2e' }, 'globalThis.__injectionProbe = "full-ran"', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).__injectionProbe).toEqual('full-ran')
    })

    it('evals the full injection contents for a different subdomain than the primary origin when document.domain injection is on', () => {
      // AUT frame at www.foobar.com, primary at app.foobar.com — different subdomains. With
      // document.domain injection on, both reduce to the foobar.com superdomain → resolves to full.
      setWindow({ origin: 'https://www.foobar.com', domain: 'www.foobar.com' })

      injectAutBridge('https://app.foobar.com', { injectDocumentDomain: true, testingType: 'e2e' }, 'globalThis.__injectionProbe = "full-ran"', {
        shouldInjectDocumentDomain: true,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).__injectionProbe).toEqual('full-ran')
    })
  })

  describe('cross-origin injection', () => {
    it('evals the cross-origin contents with cypressConfig in scope when the AUT frame origin differs from the primary origin', () => {
      // AUT frame at a different origin entirely (different domain, not just a subdomain) than the
      // primary origin → resolves to cross-origin
      setWindow({ origin: 'https://foo.bar.com', domain: 'foo.bar.com' })

      injectAutBridge('https://app.example.com', { injectDocumentDomain: false, testingType: 'e2e' }, '', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, 'globalThis.__injectionProbe = cypressConfig')

      // the spec-bridge receives the config exactly (via the JSON'd IIFE wrapper), as the proxy supplies it
      expect((globalThis as any).__injectionProbe).toEqual({
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      })
    })

    it('evals the cross-origin contents for a different subdomain than the primary origin when document.domain injection is off', () => {
      // Same different-subdomain frame as the full case above (www.foobar.com vs primary app.foobar.com),
      // but with document.domain injection off the full origins stay distinct → resolves to cross-origin.
      setWindow({ origin: 'https://www.foobar.com', domain: 'www.foobar.com' })

      injectAutBridge('https://app.foobar.com', { injectDocumentDomain: false, testingType: 'e2e' }, '', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, 'globalThis.__injectionProbe = cypressConfig')

      expect((globalThis as any).__injectionProbe).toEqual({
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      })
    })
  })

  describe('no injection', () => {
    it('evals no runner source in a non-AUT frame', () => {
      // a frame whose name is not the AUT identifier → resolves to none (no runner injection)
      setWindow({ name: 'some-other-frame' })

      injectAutBridge('https://app.example.com', { injectDocumentDomain: false, testingType: 'e2e' }, 'globalThis.__injectionProbe = "should-not-run"', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')

      expect((globalThis as any).__injectionProbe).toBeUndefined()
    })
  })

  it('propagates a bridge-install failure loudly', () => {
    // a full AUT frame whose runner source throws when eval'd — that failure is fatal for the
    // frame, so it must surface rather than silently producing a frame without window.Cypress
    setWindow({ origin: 'https://app.example.com' })

    expect(() => {
      return injectAutBridge('https://app.example.com', { injectDocumentDomain: false, testingType: 'e2e' }, 'throw new Error("boom")', {
        shouldInjectDocumentDomain: false,
        modifyObstructiveThirdPartyCode: false,
        modifyObstructiveCode: true,
        simulatedCookies: [],
      }, '')
    }).toThrow('boom')
  })

  it('swallows a document.domain failure and still injects', () => {
    // document.domain is a defensive nicety — a failure setting it must not abort the injection
    const win = setWindow({ origin: 'https://app.example.com' })

    Object.defineProperty(win.document, 'domain', {
      set () {
        throw new Error('document.domain assignment rejected')
      },
    })

    injectAutBridge('https://app.example.com', { injectDocumentDomain: true, testingType: 'e2e' }, 'globalThis.__injectionProbe = "full-ran"', {
      shouldInjectDocumentDomain: true,
      modifyObstructiveThirdPartyCode: false,
      modifyObstructiveCode: true,
      simulatedCookies: [],
    }, '')

    expect((globalThis as any).__injectionProbe).toEqual('full-ran')
  })
})
