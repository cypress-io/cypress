import { describe, expect, it, vi } from 'vitest'
import { injectIntoServiceWorker } from '../../../../lib/http/util/service-worker-injector'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION } from '../../../../lib/http/util/disable-navigation-preload'

const APP_SERVICE_WORKER_BODY = `
self.__appFetchCalls = [];
self.addEventListener('fetch', (event) => {
  self.__appFetchCalls.push(event.request.url);
  event.respondWith('handled');
});
`

// Executes the injector's generated source in a fake service worker scope so the
// wrapped fetch listener can be dispatched against, rather than only string-asserted.
const runInjectedServiceWorker = (options?: Parameters<typeof injectIntoServiceWorker>[1]) => {
  const listeners: { type: string, listener: Function }[] = []
  const clientEvents: any[] = []
  let onfetchSlot: Function | null = null

  const fakeSelf: any = {
    registration: { scope: 'https://example.com/' },
    clients: {
      claim: async () => {},
      matchAll: async () => [],
    },
    addEventListener: (type: string, listener: Function) => {
      listeners.push({ type, listener })
    },
    removeEventListener: (type: string, listener: Function) => {
      const index = listeners.findIndex((entry) => entry.type === type && entry.listener === listener)

      if (index > -1) {
        listeners.splice(index, 1)
      }
    },
    __cypressServiceWorkerClientEvent: vi.fn((event: string) => {
      clientEvents.push(JSON.parse(event))
    }),
  }

  // a real accessor pair so the injector's onfetch redefinition has a descriptor to wrap
  Object.defineProperty(fakeSelf, 'onfetch', {
    configurable: true,
    enumerable: true,
    get: () => onfetchSlot,
    set: (value: Function | null) => {
      onfetchSlot = value
    },
  })

  const actual = injectIntoServiceWorker(Buffer.from(APP_SERVICE_WORKER_BODY), options)

  // eslint-disable-next-line no-new-func
  new Function('self', actual)(fakeSelf)

  const fetchListener = listeners.find((entry) => entry.type === 'fetch')!.listener

  const dispatchTo = async (listener: Function, url: string) => {
    const respondWith = vi.fn()

    await listener({ request: { url }, respondWith })

    return { respondWith }
  }

  return {
    fakeSelf,
    clientEvents,
    dispatchFetch: (url: string) => dispatchTo(fetchListener, url),
    dispatchOnFetch: (url: string) => dispatchTo(fakeSelf.onfetch, url),
    appFetchCalls: () => fakeSelf.__appFetchCalls as string[],
    fetchRequestEvents: () => clientEvents.filter((event) => event.type === 'fetchRequest'),
  }
}

const reservedPathPrefixes = ['/__/', '/__cypress/', '/__cypress-studio', '/__cypress-cy-prompt']

describe('lib/http/util/service-worker-injector', () => {
  describe('injectIntoServiceWorker', () => {
    it('injects into the service worker', () => {
      const actual = injectIntoServiceWorker(Buffer.from('foo'))

      // this regex is used to verify the actual output,
      // it verifies the service worker has the injected __cypressInjectIntoServiceWorker
      // function followed by the contents of the user's service worker (in this case 'foo'),
      // it does not verify the contents of __cypressInjectIntoServiceWorker function
      // as it is subject to change and is not relevant to the test
      const expected = new RegExp(`
      let __cypressIsScriptEvaluated = false;
      \\(function __cypressInjectIntoServiceWorker\\(.*\\) \\{.*\\}\\)\\(null\\);
      foo;
      __cypressIsScriptEvaluated = true;`.replace(/\s/g, ''))

      expect(actual.replace(/\s/g, '')).toEqual(expect.stringMatching(expected))
    })

    it('does not prepend the navigation preload expression when the option is omitted', () => {
      const actual = injectIntoServiceWorker(Buffer.from('foo'))

      expect(actual).not.toContain(DISABLE_NAVIGATION_PRELOAD_EXPRESSION)
    })

    it('does not prepend the navigation preload expression when the option is false', () => {
      const actual = injectIntoServiceWorker(Buffer.from('foo'), { disableServiceWorkerNavigationPreload: false })

      expect(actual).not.toContain(DISABLE_NAVIGATION_PRELOAD_EXPRESSION)
    })

    it('prepends the navigation preload expression before the injector IIFE and the original body when the option is set', () => {
      const actual = injectIntoServiceWorker(Buffer.from('foo'), { disableServiceWorkerNavigationPreload: true })

      const preloadIndex = actual.indexOf(DISABLE_NAVIGATION_PRELOAD_EXPRESSION)
      const injectorIndex = actual.indexOf('__cypressInjectIntoServiceWorker')
      const bodyIndex = actual.indexOf('foo')

      expect(preloadIndex).toBeGreaterThan(-1)
      expect(preloadIndex).toBeLessThan(injectorIndex)
      expect(preloadIndex).toBeLessThan(bodyIndex)
    })
  })

  describe('reserved path prefixes', () => {
    it('declines the runner document without invoking the application listener', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      const { respondWith } = await sw.dispatchFetch('https://example.com/__/anything')

      expect(sw.appFetchCalls()).toEqual([])
      expect(respondWith).not.toHaveBeenCalled()
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://example.com/__/anything', isControlled: false }, scope: 'https://example.com/' },
      ])
    })

    it('declines runner assets without invoking the application listener', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      const { respondWith } = await sw.dispatchFetch('https://example.com/__cypress/runner/x.js')

      expect(sw.appFetchCalls()).toEqual([])
      expect(respondWith).not.toHaveBeenCalled()
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://example.com/__cypress/runner/x.js', isControlled: false }, scope: 'https://example.com/' },
      ])
    })

    it('lets the application listener handle application requests', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      const { respondWith } = await sw.dispatchFetch('https://example.com/app/page')

      expect(sw.appFetchCalls()).toEqual(['https://example.com/app/page'])
      expect(respondWith).toHaveBeenCalledWith('handled')
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://example.com/app/page', isControlled: true }, scope: 'https://example.com/' },
      ])
    })

    it('declines the cloud-delivered studio and cy-prompt bundles', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      const studio = await sw.dispatchFetch('https://example.com/__cypress-studio/app-studio.js')
      const cyPrompt = await sw.dispatchFetch('https://example.com/__cypress-cy-prompt/driver/cy-prompt.js')
      // sibling namespaces like /__cypress-studio-ai only match because the
      // cloud bundle prefixes are bare - this pins that no trailing slash is added
      const studioAi = await sw.dispatchFetch('https://example.com/__cypress-studio-ai/generate')

      expect(sw.appFetchCalls()).toEqual([])
      expect(studio.respondWith).not.toHaveBeenCalled()
      expect(cyPrompt.respondWith).not.toHaveBeenCalled()
      expect(studioAi.respondWith).not.toHaveBeenCalled()
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://example.com/__cypress-studio/app-studio.js', isControlled: false }, scope: 'https://example.com/' },
        { type: 'fetchRequest', payload: { url: 'https://example.com/__cypress-cy-prompt/driver/cy-prompt.js', isControlled: false }, scope: 'https://example.com/' },
        { type: 'fetchRequest', payload: { url: 'https://example.com/__cypress-studio-ai/generate', isControlled: false }, scope: 'https://example.com/' },
      ])
    })

    it('declines runner requests assigned through the onfetch property', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })
      const handler = vi.fn()

      sw.fakeSelf.onfetch = handler

      await sw.dispatchOnFetch('https://example.com/__/anything')

      expect(handler).not.toHaveBeenCalled()

      await sw.dispatchOnFetch('https://example.com/app/page')

      expect(handler).toHaveBeenCalledOnce()
    })

    it('respects a custom client route', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes: ['/custom-route/', '/__cypress/'] })

      await sw.dispatchFetch('https://example.com/custom-route/index.html')
      await sw.dispatchFetch('https://example.com/__/anything')

      expect(sw.appFetchCalls()).toEqual(['https://example.com/__/anything'])
    })

    it('respects a custom namespace', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes: ['/__/', '/custom-ns/'] })

      await sw.dispatchFetch('https://example.com/custom-ns/x')
      await sw.dispatchFetch('https://example.com/__cypress/x')

      expect(sw.appFetchCalls()).toEqual(['https://example.com/__cypress/x'])
    })

    it('does not decline runner paths when the prefixes are not supplied', async () => {
      const sw = runInjectedServiceWorker()

      const { respondWith } = await sw.dispatchFetch('https://example.com/__/anything')

      expect(sw.appFetchCalls()).toEqual(['https://example.com/__/anything'])
      expect(respondWith).toHaveBeenCalledWith('handled')
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://example.com/__/anything', isControlled: true }, scope: 'https://example.com/' },
      ])
    })

    it('declines runner paths on a cross-origin url', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      const { respondWith } = await sw.dispatchFetch('https://other.example/__cypress/x')

      expect(sw.appFetchCalls()).toEqual([])
      expect(respondWith).not.toHaveBeenCalled()
      expect(sw.fetchRequestEvents()).toEqual([
        { type: 'fetchRequest', payload: { url: 'https://other.example/__cypress/x', isControlled: false }, scope: 'https://example.com/' },
      ])
    })
  })
})
