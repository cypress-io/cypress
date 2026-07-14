import { describe, it, expect, vi } from 'vitest'
import { installAutBridgeInFrame, BridgeWindow } from '../../lib/install-aut-bridge-in-frame'
import { DocumentDomainInjection } from '@packages/network-tools'
import { AUT_FRAME_NAME_IDENTIFIER as marker } from '@packages/types'

// the real injectors from network-tools drive the origin-match decision, so these specs exercise the
// actual superdomain math rather than a stand-in:
// - originInjector (document.domain injection off) → origins must match exactly
// - superDomainInjector (document.domain injection on, e2e) → superdomains must match
const originInjector = DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain: false })
const superDomainInjector = DocumentDomainInjection.InjectionBehavior({ injectDocumentDomain: true, testingType: 'e2e' })

// the origin decision compares the frame's own origin against this Node-supplied primary origin —
// win.top.location is never read (it would throw cross-subdomain).
const PRIMARY_ORIGIN = 'https://app.example.com'

interface FakeWindowOptions {
  name?: string
  isTop?: boolean
  frameElementId?: string
  frameElementThrows?: boolean
  origin?: string
  href?: string
  topThrows?: boolean
}

const fakeWindow = (opts: FakeWindowOptions = {}): BridgeWindow => {
  const origin = opts.origin ?? PRIMARY_ORIGIN

  const win: any = {
    name: opts.name,
    location: { origin, href: opts.href ?? `${origin}/some/path` },
  }

  if (opts.frameElementThrows) {
    Object.defineProperty(win, 'frameElement', {
      get () {
        throw new Error('cross-origin frameElement access')
      },
    })
  } else {
    win.frameElement = opts.frameElementId === undefined ? null : { id: opts.frameElementId }
  }

  if (opts.isTop) {
    win.top = win
  } else {
    // a distinct object so `win === win.top` is false; its location must never be read, so we make
    // access throw to guard against regressing back to reading top.location.
    const top: any = {}

    if (opts.topThrows) {
      Object.defineProperty(top, 'location', {
        get () {
          throw new Error('cross-origin top.location access')
        },
      })
    }

    win.top = top
  }

  return win
}

const mockHandlers = () => {
  return {
    onFull: vi.fn(),
    onCrossOrigin: vi.fn(),
  }
}

describe('installAutBridgeInFrame', () => {
  it('runs onFull for a same-origin AUT frame (identified by window.name)', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'https://app.example.com' }),
      originInjector,
      'https://app.example.com',
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
  })

  it('treats the initial about:blank document as full', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ name: `${marker} proj`, origin: 'null', href: 'about:blank' }), originInjector, PRIMARY_ORIGIN, handlers)

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('does not treat other opaque-origin documents (sandboxed / data:) as the initial document', () => {
    const handlers = mockHandlers()

    // a sandboxed or data: document also reports origin "null", but its href is a real URL —
    // it must not take the pre-navigation full path
    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'null', href: 'https://sandboxed.example.com/page' }),
      originInjector,
      PRIMARY_ORIGIN,
      handlers,
    )

    expect(level).toEqual('cross-origin')
    expect(handlers.onFull).not.toHaveBeenCalled()
    expect(handlers.onCrossOrigin).toHaveBeenCalledTimes(1)
  })

  it('runs onCrossOrigin for an AUT frame at a different origin than the primary origin', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'https://other.example.com' }),
      originInjector,
      'https://app.example.com',
      handlers,
    )

    expect(level).toEqual('cross-origin')
    expect(handlers.onCrossOrigin).toHaveBeenCalledTimes(1)
    expect(handlers.onFull).not.toHaveBeenCalled()
  })

  it('resolves from the primary origin without reading top.location (tolerates a throwing top)', () => {
    const handlers = mockHandlers()

    // top.location throws if accessed; we must still resolve full from the frame's own origin
    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, origin: 'https://app.example.com', topThrows: true }),
      originInjector,
      'https://app.example.com',
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('identifies the AUT frame via the frameElement.id fallback when window.name was overwritten', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(
      fakeWindow({ name: 'app-overwrote-this', frameElementId: `${marker} proj`, origin: 'https://app.example.com' }),
      originInjector,
      'https://app.example.com',
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('tolerates a cross-origin throw when reading frameElement', () => {
    const handlers = mockHandlers()

    // window.name still identifies the AUT frame, so a throwing frameElement must not break it
    const level = installAutBridgeInFrame(
      fakeWindow({ name: `${marker} proj`, frameElementThrows: true, origin: 'https://app.example.com' }),
      originInjector,
      'https://app.example.com',
      handlers,
    )

    expect(level).toEqual('full')
    expect(handlers.onFull).toHaveBeenCalledTimes(1)
  })

  it('resolves to none and runs no handler for a non-AUT child frame', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ name: 'some-other-frame' }), originInjector, PRIMARY_ORIGIN, handlers)

    expect(level).toEqual('none')
    expect(handlers.onFull).not.toHaveBeenCalled()
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
  })

  it('runs no handler for the top (runner) frame', () => {
    const handlers = mockHandlers()

    const level = installAutBridgeInFrame(fakeWindow({ isTop: true }), originInjector, PRIMARY_ORIGIN, handlers)

    expect(level).toEqual('none')
    expect(handlers.onFull).not.toHaveBeenCalled()
    expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
  })

  describe('superdomain origin matching', () => {
    // an AUT frame on a different subdomain than the primary origin: www.foobar.com (primary) vs
    // app.foobar.com (this AUT frame)
    const crossSubdomainAutFrame = () => {
      return fakeWindow({ name: `${marker} proj`, origin: 'https://app.foobar.com' })
    }

    const primaryOrigin = 'https://www.foobar.com'

    it('runs onFull when the superdomains match and document.domain injection is on', () => {
      const handlers = mockHandlers()

      // superDomainInjector reduces both origins to https://foobar.com, so they match → full
      const level = installAutBridgeInFrame(crossSubdomainAutFrame(), superDomainInjector, primaryOrigin, handlers)

      expect(level).toEqual('full')
      expect(handlers.onFull).toHaveBeenCalledTimes(1)
      expect(handlers.onCrossOrigin).not.toHaveBeenCalled()
    })

    it('runs onCrossOrigin for the same subdomains when document.domain injection is off', () => {
      const handlers = mockHandlers()

      // originInjector keeps the full origins distinct (app.foobar.com !== www.foobar.com) → cross-origin
      const level = installAutBridgeInFrame(crossSubdomainAutFrame(), originInjector, primaryOrigin, handlers)

      expect(level).toEqual('cross-origin')
      expect(handlers.onCrossOrigin).toHaveBeenCalledTimes(1)
      expect(handlers.onFull).not.toHaveBeenCalled()
    })
  })
})
