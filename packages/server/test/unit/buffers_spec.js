require('../spec_helper')

const buffers = require(`${root}lib/util/buffers`)

describe('lib/util/buffers', () => {
  beforeEach(() => {
    buffers.reset()
  })

  afterEach(() => {
    buffers.reset()
  })

  context('#get', () => {
    it('returns buffer by url', () => {
      const obj = { url: 'foo' }

      buffers.set(obj)

      const buffer = buffers.get('foo')

      expect(buffer.url).to.eq(obj.url)
    })

    it('falls back to setting the port when buffer could not be found', () => {
      const obj = { url: 'https://www.google.com/' }

      buffers.set(obj)

      const buffer = buffers.get('https://www.google.com:443/')

      expect(buffer.url).to.eq(obj.url)
    })
  })

  context('#take', () => {
    it('removes the found buffer', () => {
      const obj = { url: 'https://www.google.com/' }

      buffers.set(obj)

      expect(buffers.getAny()).to.exist

      const buffer = buffers.take('https://www.google.com:443/')

      expect(buffer.url).to.eq(obj.url)

      expect(buffers.getAny()).to.be.null
    })

    it('does not remove anything when not found', () => {
      const obj = { url: 'https://www.google.com/' }

      buffers.set(obj)

      expect(buffers.getAny()).to.exist

      const buffer = buffers.take('asdf')

      expect(buffer).to.be.undefined

      expect(buffers.getAny()).to.exist
    })
  })
})
