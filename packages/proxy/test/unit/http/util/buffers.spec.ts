import { describe, beforeEach, expect, it } from 'vitest'
import { HttpBuffers, HttpBuffer } from '../../../../lib/http/util/buffers'

describe('http/util/buffers', () => {
  let buffers: HttpBuffers

  beforeEach(() => {
    buffers = new HttpBuffers()
  })

  describe('#get', () => {
    it('returns buffer by url', () => {
      const obj = { url: 'foo' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('foo') as HttpBuffer

      expect(buffer.url).toEqual(obj.url)
    })

    it('falls back to setting the port when buffer could not be found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('https://www.google.com:443/') as HttpBuffer

      expect(buffer.url).toEqual(obj.url)
    })
  })

  describe('#set', () => {
    it('isolates details from caller mutations', () => {
      const details = { isPrimarySuperDomainOrigin: false, someProp: 'original' }
      const obj = { url: 'http://example.com/', details } as unknown as HttpBuffer

      buffers.set(obj)

      // Mutate the original details after storing
      details.isPrimarySuperDomainOrigin = true
      details.someProp = 'mutated'

      const buffer = buffers.get('http://example.com/') as HttpBuffer

      expect((buffer as any).details.isPrimarySuperDomainOrigin).toEqual(false)
      expect((buffer as any).details.someProp).toEqual('original')
    })
  })

  describe('#take', () => {
    it('removes the found buffer', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.buffer).toBeDefined()

      const buffer = buffers.take('https://www.google.com:443/') as HttpBuffer

      expect(buffer.url).toEqual(obj.url)

      expect(buffers.buffer).toBeUndefined()
    })

    it('does not remove anything when not found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.buffer).toBeDefined()

      const buffer = buffers.take('asdf')

      expect(buffer).toBeUndefined()

      expect(buffers.buffer).toBeDefined()
    })
  })
})
