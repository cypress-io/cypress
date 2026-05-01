import { describe, expect, it, vi } from 'vitest'
import cypressRequestPromise from '@cypress/request-promise'
import { DeferredSourceMapCache } from '../../lib/deferred-source-map-cache'
import {
  testSourceWithExternalSourceMap,
  testSourceWithInlineSourceMap,
  testSourceMap,
  testSourceWithNoSourceMap,
} from '../fixtures'

describe('DeferredSourceMapCache', function () {
  let cache: DeferredSourceMapCache

  beforeEach(() => {
    cache = new DeferredSourceMapCache(vi.fn() as unknown as typeof cypressRequestPromise)
  })

  describe('#defer', () => {
    it('adds to requests', () => {
      const request = { uniqueId: 'foo', url: 'bar' }

      cache.defer(request)
      expect(cache.requests).toEqual([request])
    })

    it('replaces existing requests for same URL', () => {
      const request0 = { uniqueId: 'kung-fu', url: 'http://other.url/foo.js' }
      const request1 = { uniqueId: 'foo', url: 'http://bar.baz/quux.js' }
      const request2 = { uniqueId: 'kung-foo', url: 'http://bar.baz/quux.js' }

      cache.defer(request0)
      cache.defer(request1)
      cache.defer(request2)
      expect(cache.requests).toEqual([request0, request2])
    })

    it('throws if uniqueId is duplicated', () => {
      cache.defer({ uniqueId: 'foo', url: 'bar' })
      expect(() => {
        cache.defer({ uniqueId: 'foo', url: 'baz' })
      }).toThrow()
    })
  })

  describe('#resolve', () => {
    it('rejects if unknown uniqueId', async () => {
      cache.defer({
        uniqueId: 'baz',
        url: 'quux',
      })

      await expect(cache.resolve('foo', {})).rejects.toThrow('Missing request with ID \'foo\'')
    })

    it('rejects if request missing JS', async () => {
      cache.defer({
        uniqueId: 'foo',
        url: 'bar',
      })

      await expect(cache.resolve('foo', {})).rejects.toThrow(/^Missing JS/)
    })

    describe('sourcemap generation', () => {
      it('for JS with no original sourcemap', async () => {
        cache.defer({
          uniqueId: 'foo',
          url: 'bar',
          js: 'console.log()',
          resHeaders: {},
        })

        const result = await cache.resolve('foo', {})

        expect(result).toMatchSnapshot()
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

        expect(result0).toEqual(result1) // same object reference
      })

      describe('composition', () => {
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
            const result = await cache.resolve('foo', {})

            expect(result).toMatchSnapshot()

            if (!expectRequest) {
              return
            }

            expect(cache.requestPromise).toHaveBeenCalledWith({
              uri: 'http://somedomain.net/dir/test.js.map',
              headers: {},
              timeout: 5000,
              resolveWithFullResponse: true,
            })
          }
        }

        beforeEach(() => {
          // @ts-expect-error: @cypress/request-promise not typed
          cache.requestPromise.mockResolvedValue({ body: testSourceMap })
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
