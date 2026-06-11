import { afterAll, describe, expect, it, vi } from 'vitest'
import { queueRewriting, terminateAllWorkers } from '../../lib/threads'

describe('lib/threads', () => {
  afterAll(async () => {
    await terminateAllWorkers()
  })

  describe('queueRewriting', () => {
    describe('passthrough fast path', () => {
      it('resolves JS without possible rewrite targets on the main thread, stripping sourcemap urls', async () => {
        const source = 'const add = (a, b) => a + b\n//# sourceMappingURL=add.js.map'

        const output = await queueRewriting({
          url: 'http://example.com/add.js',
          source,
        })

        expect(output).toEqual('const add = (a, b) => a + b')
      })

      it('defers a sourcemap rewrite with a main-thread unique id', async () => {
        const deferSourceMapRewrite = vi.fn()
        const source = 'const add = (a, b) => a + b'

        const output = await queueRewriting({
          url: 'http://example.com/add2.js',
          source,
          deferSourceMapRewrite,
        })

        expect(deferSourceMapRewrite).toHaveBeenCalledTimes(1)

        const { uniqueId, url, js } = deferSourceMapRewrite.mock.calls[0][0]

        // ids generated on the main thread are prefixed with `0`
        expect(uniqueId).toMatch(/^0\.\d+$/)
        expect(url).toEqual('http://example.com/add2.js')
        expect(js).toEqual(source)

        expect(output).toEqual(`${source}\n//# sourceMappingURL=/__cypress/source-maps/${uniqueId}.map`)
      })
    })
  })
})
