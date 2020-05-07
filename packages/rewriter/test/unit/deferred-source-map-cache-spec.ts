import { DeferredSourceMapCache } from '../../lib/deferred-source-map-cache'
import sinon from 'sinon'
import chai, { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinonChai from 'sinon-chai'
import {
  testSourceWithExternalSourceMap,
  testSourceWithInlineSourceMap,
  testSourceMap,
  testSourceWithNoSourceMap,
} from '../fixtures'
import snapshot from 'snap-shot-it'

chai.use(chaiAsPromised)
chai.use(sinonChai)

describe('DeferredSourceMapCache', function () {
  let cache: DeferredSourceMapCache

  beforeEach(() => {
    cache = new DeferredSourceMapCache(sinon.stub())
  })

  afterEach(() => {
    sinon.restore()
  })

  context('#defer', () => {
    it('adds to requests', () => {
      const request = { uniqueId: 'foo', url: 'bar' }

      cache.defer(request)
      expect(cache.requests).to.deep.eq([request])
    })

    it('replaces existing requests for same URL', () => {
      const request0 = { uniqueId: 'kung-fu', url: 'http://other.url/foo.js' }
      const request1 = { uniqueId: 'foo', url: 'http://bar.baz/quux.js' }
      const request2 = { uniqueId: 'kung-foo', url: 'http://bar.baz/quux.js' }

      cache.defer(request0)
      cache.defer(request1)
      cache.defer(request2)
      expect(cache.requests).to.deep.eq([request0, request2])
    })

    it('throws if uniqueId is duplicated', () => {
      cache.defer({ uniqueId: 'foo', url: 'bar' })
      expect(() => {
        cache.defer({ uniqueId: 'foo', url: 'baz' })
      }).to.throw
    })
  })

  context('#resolve', () => {
    it('rejects if unknown uniqueId', async () => {
      cache.defer({
        uniqueId: 'baz',
        url: 'quux',
      })

      await expect(cache.resolve('foo', {})).to.be.rejectedWith('Missing request with ID \'foo\'')
    })

    it('rejects if request missing JS', async () => {
      cache.defer({
        uniqueId: 'foo',
        url: 'bar',
      })

      await expect(cache.resolve('foo', {})).to.be.rejectedWith(/^Missing JS/)
    })

    context('sourcemap generation', () => {
      it('for JS with no original sourcemap', async () => {
        cache.defer({
          uniqueId: 'foo',
          url: 'bar',
          js: 'console.log()',
          resHeaders: {},
        })

        snapshot(await cache.resolve('foo', {}))
      })

      it('resolves with cached sourceMap on retry', async () => {
        cache.defer({
          uniqueId: 'foo',
          url: 'bar',
          js: 'console.log()',
          resHeaders: {},
        })

        const result0 = await cache.resolve('foo', {})
        const result1 = await cache.resolve('foo', {})

        expect(result0).to.eq(result1) // same object reference
      })

      context('composition', () => {
        const URL = 'http://somedomain.net/dir/foo.js'

        const testExternalSourceMap = (js, resHeaders, expectRequest = true) => {
          return async () => {
            cache.defer({
              uniqueId: 'foo',
              url: URL,
              js,
              resHeaders,
            })

            // @ts-ignore: https://github.com/bahmutov/snap-shot-it/issues/522
            snapshot('composed sourcemap', await cache.resolve('foo', {}), { allowSharedSnapshot: true })

            if (!expectRequest) {
              return
            }

            expect(cache.requestLib).to.be.calledWith({
              url: 'http://somedomain.net/dir/test.js.map',
              headers: {},
              timeout: 5000,
            })
          }
        }

        beforeEach(() => {
          cache.requestLib.resolves({ body: testSourceMap })
        })

        it('with inlined base64 sourceMappingURL', testExternalSourceMap(testSourceWithInlineSourceMap, {}, false))

        it('with external sourceMappingURL', testExternalSourceMap(testSourceWithExternalSourceMap, {
          // sourceMappingURL should override headers
          'SOURCEmap': 'garbage',
          'x-sourceMAP': 'garbage',
        }))

        it('with map referenced by sourcemap header', testExternalSourceMap(testSourceWithNoSourceMap, {
          'SOURCEmap': 'test.js.map',
          'x-sourceMAP': 'garbage', // SourceMap header should override x-sourcemap
        }))

        it('with map referenced by x-sourcemap header', testExternalSourceMap(testSourceWithNoSourceMap, {
          'x-sourceMAP': 'test.js.map',
        }))
      })
    })
  })
})
