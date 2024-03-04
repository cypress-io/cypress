import { expect } from 'chai'
import { injectIntoServiceWorker } from '../../../../lib/http/util/service-worker-injector'

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

      expect(actual.replace(/\s/g, '')).to.match(expected)
    })
  })
})
