import { getBodyEncoding, parseContentType } from '../../lib/server/util'
import { expect } from 'chai'
import { join } from 'path'
import { readFileSync } from 'fs'

const imageBuffer = readFileSync(join(__dirname, '..', 'fixtures', 'cypress-logo.png'))

describe('net-stubbing util', () => {
  describe('parseContentType', () => {
    it('returns application/json', () => {
      const str = JSON.stringify({ foo: 'bar' })

      expect(parseContentType(str)).to.eq('application/json')
    })

    it('returns text/html', () => {
      const str = `\
<html>
  <body>foobarbaz</body>
</html>\
`

      expect(parseContentType(str)).to.eq('text/html')
    })

    it('returns text/plain', () => {
      const str = 'foobar<p>baz'

      expect(parseContentType(str)).to.eq('text/plain')
    })

    it('returns text/plain by default', () => {
      expect(parseContentType()).to.eq('text/plain')
    })
  })

  context('getBodyEncoding', () => {
    it('returns null without data', () => {
      expect(getBodyEncoding(null)).to.equal(null)

      const emptyRequest = {
        body: null,
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(emptyRequest)).to.equal(null)
    })

    it('returns utf8', () => {
      // possible content-type variants
      // https://tools.ietf.org/html/rfc7231#section-3.1.1.1
      const types = [
        'text/html;charset=utf-8',
        'text/html;charset=UTF-8',
        'Text/HTML;Charset="utf-8"',
        'text/html; charset="utf-8"',
      ]

      types.forEach((contentType) => {
        const req = {
          body: 'some data',
          headers: {
            'content-type': contentType,
          },
          method: 'POST',
          url: 'somewhere',
          httpVersion: '1.1',
        }

        expect(getBodyEncoding(req), contentType).to.equal('utf8')
      })
    })

    it('falls back to inspecting bytes to find text', () => {
      const req = {
        body: Buffer.from('hello world'),
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(req), 'text').to.equal('utf8')
    })

    it('falls back to inspecting bytes to find image', () => {
      const req = {
        body: imageBuffer,
        headers: null,
        method: 'POST',
        url: 'somewhere',
        httpVersion: '1.1',
      }

      expect(getBodyEncoding(req), 'image').to.equal('binary')
    })
  })
})
