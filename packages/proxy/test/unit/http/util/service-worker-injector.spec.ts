import { describe, expect, it, vi } from 'vitest'
import { getServiceWorkerInstrumentationExpression, injectIntoServiceWorker } from '../../../../lib/http/util/service-worker-injector'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION } from '../../../../lib/http/util/disable-navigation-preload.injected'

const APP_SERVICE_WORKER_BODY = `
self.__appFetchCalls = [];
self.addEventListener('fetch', (event) => {
  self.__appFetchCalls.push(event.request.url);
  event.respondWith('handled');
});
`

// Executes the injector's generated source in a fake service worker scope so the
// wrapped fetch listener can be dispatched against, rather than only string-asserted.
// With reservedPathPrefixes it runs the browser network path's form: the
// instrumentation expression, evaluated ahead of the unmodified script.
const runInjectedServiceWorker = (options: { reservedPathPrefixes?: string[], hasBinding?: boolean, instrumentationEvaluations?: number } = {}) => {
  const listeners: { type: string, listener: (...args: any[]) => unknown }[] = []
  const clientEvents: any[] = []
  let onfetchSlot: ((...args: any[]) => unknown) | null = null

  const fakeSelf: any = {
    registration: { scope: 'https://example.com/' },
    clients: {
      claim: async () => {},
      matchAll: async () => [],
    },
    addEventListener: (type: string, listener: (...args: any[]) => unknown) => {
      listeners.push({ type, listener })
    },
    removeEventListener: (type: string, listener: (...args: any[]) => unknown) => {
      const index = listeners.findIndex((entry) => entry.type === type && entry.listener === listener)

      if (index > -1) {
        listeners.splice(index, 1)
      }
    },
  }

  if (options.hasBinding !== false) {
    fakeSelf.__cypressServiceWorkerClientEvent = vi.fn((event: string) => {
      clientEvents.push(JSON.parse(event))
    })
  }

  // a real accessor pair so the injector's onfetch redefinition has a descriptor to wrap
  Object.defineProperty(fakeSelf, 'onfetch', {
    configurable: true,
    enumerable: true,
    get: () => onfetchSlot,
    set: (value: ((...args: any[]) => unknown) | null) => {
      onfetchSlot = value
    },
  })

  if (options.reservedPathPrefixes) {
    const expression = getServiceWorkerInstrumentationExpression({ reservedPathPrefixes: options.reservedPathPrefixes })

    for (let i = 0; i < (options.instrumentationEvaluations ?? 1); i++) {
      new Function('self', expression)(fakeSelf)
    }

    new Function('self', APP_SERVICE_WORKER_BODY)(fakeSelf)
  } else {
    new Function('self', injectIntoServiceWorker(Buffer.from(APP_SERVICE_WORKER_BODY)))(fakeSelf)
  }

  const fetchListener = listeners.find((entry) => entry.type === 'fetch')!.listener

  const dispatchTo = async (listener: (...args: any[]) => unknown, url: string) => {
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
      \\(function __cypressInjectIntoServiceWorker\\(.*\\) \\{.*\\}\\)\\(null, \\(\\) => __cypressIsScriptEvaluated\\);
      foo;
      __cypressIsScriptEvaluated = true;`.replace(/\s/g, ''))

      expect(actual.replace(/\s/g, '')).toEqual(expect.stringMatching(expected))
    })

    it('does not include the navigation preload expression', () => {
      const actual = injectIntoServiceWorker(Buffer.from('foo'))

      expect(actual).not.toContain(DISABLE_NAVIGATION_PRELOAD_EXPRESSION)
    })

    it('does not report fetch handlers while the script is still evaluating', () => {
      const sw = runInjectedServiceWorker()

      expect(sw.clientEvents).toEqual([])
    })
  })

  describe('getServiceWorkerInstrumentationExpression', () => {
    it('disables navigation preload ahead of the instrumentation', () => {
      const actual = getServiceWorkerInstrumentationExpression({ reservedPathPrefixes })

      const preloadIndex = actual.indexOf(DISABLE_NAVIGATION_PRELOAD_EXPRESSION)
      const injectorIndex = actual.indexOf('__cypressInjectIntoServiceWorker')

      expect(preloadIndex).toBeGreaterThan(-1)
      expect(preloadIndex).toBeLessThan(injectorIndex)
    })

    it('reports fetch handlers the script adds once the binding exists', () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes })

      expect(sw.clientEvents).toEqual([
        { type: 'hasFetchHandler', payload: { hasFetchHandler: true }, scope: 'https://example.com/' },
      ])
    })

    // a crash-reloaded worker can be sent the expression by both the page
    // connection's crash handler and the browser connection's crash hold
    it('instruments a worker once when the expression is evaluated twice before its script runs', async () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes, instrumentationEvaluations: 2 })

      await sw.dispatchFetch('https://example.com/api/users')

      expect(sw.appFetchCalls()).toEqual(['https://example.com/api/users'])
      expect(sw.fetchRequestEvents()).toHaveLength(1)
      expect(sw.clientEvents.filter((event) => event.type === 'hasFetchHandler')).toHaveLength(1)
    })

    it('does not call a binding that does not exist yet when the script adds a fetch handler', () => {
      const sw = runInjectedServiceWorker({ reservedPathPrefixes, hasBinding: false })

      expect(sw.clientEvents).toEqual([])
      expect(sw.appFetchCalls()).toEqual([])
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
