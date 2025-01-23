require('../spec_helper')

const xhrs = require(`../../lib/controllers/xhrs`)

describe('lib/controllers/xhr', () => {
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
