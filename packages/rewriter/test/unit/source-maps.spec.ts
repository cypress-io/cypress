import { describe, expect, it } from 'vitest'
import * as sourceMaps from '../../lib/util/source-maps'

describe('lib/util/source-maps', () => {
  describe('tryDecodeInlineUrl', () => {
    const sourceMap = { version: 3, sources: ['foo.ts'], mappings: 'AAAA' }
    const base64 = Buffer.from(JSON.stringify(sourceMap)).toString('base64')

    it('decodes an inline source map without a charset', () => {
      const url = `data:application/json;base64,${base64}`

      expect(sourceMaps.tryDecodeInlineUrl(url)).to.deep.equal(sourceMap)
    })

    it('decodes an inline source map with a utf-8 charset', () => {
      const url = `data:application/json;charset=utf-8;base64,${base64}`

      expect(sourceMaps.tryDecodeInlineUrl(url)).to.deep.equal(sourceMap)
    })

    it('returns undefined for a non-inline url', () => {
      expect(sourceMaps.tryDecodeInlineUrl('http://localhost/foo.js.map')).to.be.undefined
    })
  })
})
