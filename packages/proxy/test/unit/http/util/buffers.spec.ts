import { expect } from 'chai'
import { HttpBuffers, HttpBuffer } from '../../../../lib/http/util/buffers'

describe('http/util/buffers', () => {
  let buffers: HttpBuffers

  beforeEach(() => {
    buffers = new HttpBuffers()
  })

  context('#get', () => {
    it('returns buffer by url', () => {
      const obj = { url: 'foo' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('foo') as HttpBuffer

      expect(buffer.url).to.eq(obj.url)
    })

    it('falls back to setting the port when buffer could not be found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('https://www.google.com:443/') as HttpBuffer

      expect(buffer.url).to.eq(obj.url)
    })
  })

  context('#take', () => {
    it('removes the found buffer', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.buffer).to.exist

      const buffer = buffers.take('https://www.google.com:443/') as HttpBuffer

      expect(buffer.url).to.eq(obj.url)

      expect(buffers.buffer).to.be.undefined
    })

    it('does not remove anything when not found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.buffer).to.exist

      const buffer = buffers.take('asdf')

      expect(buffer).to.be.undefined

      expect(buffers.buffer).to.exist
    })
  })
})
