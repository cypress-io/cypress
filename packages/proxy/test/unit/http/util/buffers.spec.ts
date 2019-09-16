import { expect } from 'chai'
import { HttpBuffers, HttpBuffer } from '../../../../lib/http/util/buffers'

describe('http/util/buffers', () => {
  let buffers : HttpBuffers

  beforeEach(() => {
    buffers = new HttpBuffers()
  })

  context('#get', () => {
    it('returns buffer by url', () => {
      const obj = { url: 'foo' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('foo')

      expect(buffer).to.deep.eq(obj)
    })

    it('falls back to setting the port when buffer could not be found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.get('https://www.google.com:443/')

      expect(buffer).to.deep.eq(obj)
    })
  })

  context('#getByOriginalUrl', () => {
    it('returns buffer by originalUrl', () => {
      const obj = { originalUrl: 'foo' } as HttpBuffer

      buffers.set(obj)

      const buffer = buffers.getByOriginalUrl('foo')

      expect(buffer).to.deep.eq(obj)
    })
  })

  context('#take', () => {
    it('removes the found buffer', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.all()).to.have.length(1)

      const buffer = buffers.take('https://www.google.com:443/')

      expect(buffer).to.deep.eq(obj)

      expect(buffers.all()).to.have.length(0)
    })

    it('does not remove anything when not found', () => {
      const obj = { url: 'https://www.google.com/' } as HttpBuffer

      buffers.set(obj)

      expect(buffers.all()).to.have.length(1)

      const buffer = buffers.take('asdf')

      expect(buffer).to.be.undefined

      expect(buffers.all()).to.have.length(1)
    })
  })
})
