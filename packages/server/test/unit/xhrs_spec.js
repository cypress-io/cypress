require('../spec_helper')

const xhrs = require(`${root}lib/controllers/xhrs`)

describe('lib/controllers/xhr', () => {
  describe('#parseContentType', () => {
    it('returns application/json', () => {
      const str = JSON.stringify({ foo: 'bar' })

      expect(xhrs.parseContentType(str)).to.eq('application/json')
    })

    it('returns text/html', () => {
      const str = `\
<html>
  <body>foobarbaz</body>
</html>\
`

      expect(xhrs.parseContentType(str)).to.eq('text/html')
    })

    it('returns text/plain', () => {
      const str = 'foobar<p>baz'

      expect(xhrs.parseContentType(str)).to.eq('text/plain')
    })

    it('returns text/plain by default', () => {
      expect(xhrs.parseContentType()).to.eq('text/plain')
    })
  })

  describe('#parseHeaders', () => {
    it('returns object literal on undefined', () => {
      const obj = xhrs.parseHeaders(undefined)

      expect(obj).to.deep.eq({
        'content-type': 'text/plain',
      })
    })

    it('uses passed in content-type', () => {
      const obj = xhrs.parseHeaders({ 'content-type': 'application/json' }, 'foo')

      expect(obj).to.deep.eq({
        'content-type': 'application/json',
      })
    })

    it('uses response if content-type is omitted', () => {
      const obj = xhrs.parseHeaders({}, '<html>foo</html>')

      expect(obj).to.deep.eq({
        'content-type': 'text/html',
      })
    })

    it('sets content-type to application/json', () => {
      const str = JSON.stringify({ foo: 'bar' })
      const obj = xhrs.parseHeaders({ 'x-token': '1234' }, str)

      expect(obj).to.deep.eq({
        'x-token': '1234',
        'content-type': 'application/json',
      })
    })
  })
})
