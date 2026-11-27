/// <reference types="vitest/jsdom" />
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SerializableAutomationCookie } from '@packages/server/lib/automation/cookie/jar'

// The patches and timers each have their own behavior covered by the driver's
// cy.origin() e2e specs; here they are mocked so the tests can check how the
// entry wires them up.
vi.mock('../../../injection/timers', () => {
  return {
    createTimers: vi.fn(() => ({ wrap: vi.fn(), reset: vi.fn(), pause: vi.fn() })),
  }
})

vi.mock('../../../injection/patches/cross-origin/cookies', () => {
  return {
    patchDocumentCookie: vi.fn(() => ({ onCypress: vi.fn() })),
  }
})

vi.mock('../../../injection/patches/integrity', () => ({ patchElementIntegrity: vi.fn() }))
vi.mock('../../../injection/patches/cross-origin/fetch', () => ({ patchFetch: vi.fn() }))
vi.mock('../../../injection/patches/cross-origin/xmlHttpRequest', () => ({ patchXmlHttpRequest: vi.fn() }))

const AUT_URL = 'http://foobar.com:3500/fixtures/secondary-origin.html'
const AUT_ORIGIN = 'http://foobar.com:3500'

const simulatedCookies: SerializableAutomationCookie[] = [{
  name: 'session_id',
  value: '7f3c9a1e5b2d4c8f',
  domain: 'foobar.com',
  path: '/',
  secure: false,
  httpOnly: false,
  hostOnly: true,
  expiry: null,
  maxAge: null,
  sameSite: 'lax',
}]

interface FakeFrame {
  Cypress?: ReturnType<typeof createFakeCypress>
  location: { origin: string }
}

const createFakeCypress = ({ withCy = true } = {}) => {
  return {
    cy: withCy ? {} : undefined,
    action: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
  }
}

const sameOriginFrame = (Cypress = createFakeCypress()): FakeFrame => ({ Cypress, location: { origin: AUT_ORIGIN } })

// What Chrome throws when a script reads a property of a cross-origin frame
const crossOriginBlockedFrame = () => {
  return {
    get Cypress (): never {
      throw new DOMException(`Blocked a frame with origin "${AUT_ORIGIN}" from accessing a cross-origin frame.`, 'SecurityError')
    },
    location: { origin: 'http://localhost:3500' },
  }
}

const listeners: [string, EventListenerOrEventListenerObject][] = []
const frameElementDescriptor = Object.getOwnPropertyDescriptor(window, 'frameElement')
const realAddEventListener = window.addEventListener.bind(window)

let fakeParent: { frames: unknown[], postMessage: ReturnType<typeof vi.fn> }
let postMessageToTop: ReturnType<typeof vi.spyOn>

const loadInjection = async ({
  frames = [] as unknown[],
  modifyObstructiveCode = false,
  modifyObstructiveThirdPartyCode = false,
} = {}) => {
  fakeParent.frames = frames
  Object.assign(globalThis, {
    cypressConfig: { modifyObstructiveCode, modifyObstructiveThirdPartyCode, simulatedCookies },
  })

  await import('../../../injection/cross-origin')

  const timers = await import('../../../injection/timers')
  const cookies = await import('../../../injection/patches/cross-origin/cookies')

  return {
    timers: vi.mocked(timers.createTimers).mock.results[0].value,
    documentCookiePatch: vi.mocked(cookies.patchDocumentCookie).mock.results[0].value,
    patchDocumentCookie: vi.mocked(cookies.patchDocumentCookie),
    patchElementIntegrity: vi.mocked((await import('../../../injection/patches/integrity')).patchElementIntegrity),
    patchFetch: vi.mocked((await import('../../../injection/patches/cross-origin/fetch')).patchFetch),
    patchXmlHttpRequest: vi.mocked((await import('../../../injection/patches/cross-origin/xmlHttpRequest')).patchXmlHttpRequest),
  }
}

const throwInAut = (error: unknown) => {
  window.dispatchEvent(new ErrorEvent('error', { error, message: String(error) }))
}

// Vitest rethrows an error event as an uncaught exception when no listener is
// registered for it, which is the state the injection leaves once a spec bridge
// attaches. This stands in for the browser reporting the error itself.
const reportedByBrowser = () => {}

describe('injection/cross-origin', () => {
  // The cross-origin injection only runs in an AUT on a secondary origin
  beforeAll(() => {
    jsdom.reconfigure({ url: AUT_URL })
  })

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    realAddEventListener('error', reportedByBrowser)

    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      listeners.push([type, listener])
      realAddEventListener(type, listener, options)
    })

    fakeParent = { frames: [], postMessage: vi.fn() }
    vi.spyOn(window, 'parent', 'get').mockReturnValue(fakeParent as unknown as Window)

    // jsdom will not let `top` be redefined, and in a top-level jsdom
    // window `top` is the window itself
    postMessageToTop = vi.spyOn(window, 'postMessage').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()

    listeners.splice(0).forEach(([type, listener]) => window.removeEventListener(type, listener))
    window.removeEventListener('error', reportedByBrowser)

    if (frameElementDescriptor) {
      Object.defineProperty(window, 'frameElement', frameElementDescriptor)
    }

    delete window.__attachToCypress
  })

  it('runs against the secondary origin the AUT is served from', () => {
    expect(window.location.href).toBe(AUT_URL)
  })

  describe('location requests', () => {
    it('replies to aut:cypress:location with the current href on the given port', async () => {
      await loadInjection()

      const port = { postMessage: vi.fn() }

      window.dispatchEvent(new MessageEvent('message', { data: 'aut:cypress:location', ports: [port as unknown as MessagePort] }))

      expect(port.postMessage).toHaveBeenCalledExactlyOnceWith(AUT_URL)
    })

    it('ignores other messages', async () => {
      await loadInjection()

      const port = { postMessage: vi.fn() }

      window.dispatchEvent(new MessageEvent('message', { data: 'cross:origin:bridge:ready', ports: [port as unknown as MessagePort] }))

      expect(port.postMessage).not.toHaveBeenCalled()
    })
  })

  it('tells the parent the AUT is unloading, even before a spec bridge attaches', async () => {
    await loadInjection()

    window.dispatchEvent(new Event('beforeunload'))

    expect(fakeParent.postMessage).toHaveBeenCalledExactlyOnceWith({ event: 'cross:origin:before:unload', data: AUT_ORIGIN }, '*')
  })

  describe('uncaught errors before a spec bridge attaches', () => {
    it('forwards the message and stack of an Error to top', async () => {
      await loadInjection()

      const error = new TypeError('Cannot read properties of undefined (reading \'id\')')

      throwInAut(error)

      expect(postMessageToTop).toHaveBeenCalledExactlyOnceWith({
        event: 'cross:origin:aut:throw:error',
        data: { href: AUT_URL, message: error.message, stack: error.stack },
      }, '*')
    })

    it('forwards a thrown value that is not an Error as the message', async () => {
      await loadInjection()

      throwInAut('checkout failed')

      expect(postMessageToTop).toHaveBeenCalledExactlyOnceWith({
        event: 'cross:origin:aut:throw:error',
        data: { href: AUT_URL, message: 'checkout failed' },
      }, '*')
    })

    it('forwards an error event with no error object, as browsers fire for cross-origin scripts, with a null message', async () => {
      await loadInjection()

      window.dispatchEvent(new ErrorEvent('error', { message: 'Script error.' }))

      expect(postMessageToTop).toHaveBeenCalledExactlyOnceWith({
        event: 'cross:origin:aut:throw:error',
        data: { href: AUT_URL, message: null },
      }, '*')
    })
  })

  describe('patches', () => {
    it('applies the document.cookie, fetch, XMLHttpRequest and timer patches', async () => {
      const { patchDocumentCookie, patchFetch, patchXmlHttpRequest, timers } = await loadInjection()

      expect(patchDocumentCookie).toHaveBeenCalledExactlyOnceWith(simulatedCookies)
      expect(patchFetch).toHaveBeenCalledExactlyOnceWith(window)
      expect(patchXmlHttpRequest).toHaveBeenCalledExactlyOnceWith(window)
      expect(timers.wrap).toHaveBeenCalledOnce()
    })

    it('hides the iframe from window.frameElement when modifyObstructiveCode is on', async () => {
      await loadInjection({ modifyObstructiveCode: true })

      expect(window.frameElement).toBeNull()
      expect(Object.getOwnPropertyDescriptor(window, 'frameElement')?.get?.()).toBeNull()
    })

    it('leaves window.frameElement alone when modifyObstructiveCode is off', async () => {
      await loadInjection({ modifyObstructiveCode: false })

      expect(Object.getOwnPropertyDescriptor(window, 'frameElement')).toEqual(frameElementDescriptor)
    })

    it('strips integrity attributes only when modifyObstructiveThirdPartyCode is on', async () => {
      const { patchElementIntegrity } = await loadInjection({ modifyObstructiveThirdPartyCode: true })

      expect(patchElementIntegrity).toHaveBeenCalledExactlyOnceWith(window)
    })

    it('keeps integrity attributes when modifyObstructiveThirdPartyCode is off', async () => {
      const { patchElementIntegrity } = await loadInjection({ modifyObstructiveThirdPartyCode: false })

      expect(patchElementIntegrity).not.toHaveBeenCalled()
    })
  })

  describe('window.__attachToCypress', () => {
    it('hands Cypress to the cookie patch and wires up the timers', async () => {
      const { documentCookiePatch, timers } = await loadInjection()
      const Cypress = createFakeCypress()

      window.__attachToCypress?.(Cypress as unknown as Cypress.Cypress)

      expect(documentCookiePatch.onCypress).toHaveBeenCalledExactlyOnceWith(Cypress)
      expect(Cypress.removeAllListeners).toHaveBeenCalledWith('app:timers:reset')
      expect(Cypress.removeAllListeners).toHaveBeenCalledWith('app:timers:pause')
      expect(Cypress.on).toHaveBeenCalledWith('app:timers:reset', timers.reset)
      expect(Cypress.on).toHaveBeenCalledWith('app:timers:pause', timers.pause)
      expect(Math.max(...Cypress.removeAllListeners.mock.invocationCallOrder))
      .toBeLessThan(Math.min(...Cypress.on.mock.invocationCallOrder))
    })

    it('stops forwarding uncaught errors to top once a spec bridge attaches', async () => {
      await loadInjection()

      window.__attachToCypress?.(createFakeCypress() as unknown as Cypress.Cypress)
      throwInAut(new Error('payment widget failed to load'))

      expect(postMessageToTop).not.toHaveBeenCalled()
    })

    it('removes itself after attaching', async () => {
      await loadInjection()

      window.__attachToCypress?.(createFakeCypress() as unknown as Cypress.Cypress)

      expect(window).not.toHaveProperty('__attachToCypress')
    })

    it('refuses a Cypress without the event emitter the driver mixes in', async () => {
      const { documentCookiePatch } = await loadInjection()
      const { removeAllListeners: _removeAllListeners, ...withoutEmitter } = createFakeCypress()

      expect(() => window.__attachToCypress?.(withoutEmitter as unknown as Cypress.Cypress))
      .toThrow('The spec bridge passed a Cypress without an event emitter to `window.__attachToCypress`')

      expect(documentCookiePatch.onCypress).not.toHaveBeenCalled()
    })
  })

  describe('finding the spec bridge', () => {
    it('attaches to a same-origin spec bridge that is ready and announces the window', async () => {
      const Cypress = createFakeCypress()
      const { documentCookiePatch } = await loadInjection({ frames: [sameOriginFrame(Cypress)] })

      expect(documentCookiePatch.onCypress).toHaveBeenCalledExactlyOnceWith(Cypress)
      expect(Cypress.action).toHaveBeenCalledExactlyOnceWith('app:window:before:load', window)
      expect(window).not.toHaveProperty('__attachToCypress')
    })

    it('skips frames blocked by the same-origin policy and keeps searching', async () => {
      const Cypress = createFakeCypress()

      await loadInjection({ frames: [crossOriginBlockedFrame(), sameOriginFrame(Cypress)] })

      expect(Cypress.action).toHaveBeenCalledExactlyOnceWith('app:window:before:load', window)
    })

    it('skips frames on another origin', async () => {
      const Cypress = createFakeCypress()

      await loadInjection({ frames: [{ Cypress, location: { origin: 'http://localhost:3500' } }] })

      expect(Cypress.action).not.toHaveBeenCalled()
      expect(window.__attachToCypress).toBeTypeOf('function')
    })

    it('waits for the spec bridge to attach when its cy is not ready yet', async () => {
      const Cypress = createFakeCypress({ withCy: false })
      const { documentCookiePatch } = await loadInjection({ frames: [sameOriginFrame(Cypress)] })

      expect(Cypress.action).not.toHaveBeenCalled()
      expect(documentCookiePatch.onCypress).not.toHaveBeenCalled()
      expect(window.__attachToCypress).toBeTypeOf('function')
    })

    it('waits for a spec bridge when the parent has no frames with Cypress', async () => {
      await loadInjection({ frames: [{ location: { origin: AUT_ORIGIN } }, crossOriginBlockedFrame()] })

      expect(window.__attachToCypress).toBeTypeOf('function')
    })

    it('rethrows errors other than SecurityError from reading a frame', async () => {
      const error = new TypeError('frame.location is null')

      await expect(loadInjection({
        frames: [{
          get Cypress (): never {
            throw error
          },
        }],
      })).rejects.toBe(error)
    })
  })
})
