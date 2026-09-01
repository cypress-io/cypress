import { describe, expect, it } from 'vitest'
import { injectIntoServiceWorker } from '../../../../lib/http/util/service-worker-injector'
import { DISABLE_NAVIGATION_PRELOAD_EXPRESSION } from '../../../../lib/http/util/disable-navigation-preload'

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
      \\(function __cypressInjectIntoServiceWorker\\(\\) \\{.*\\}\\)\\(\\);
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
})
