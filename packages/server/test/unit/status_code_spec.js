require('../spec_helper')

const statusCode = require(`${root}lib/util/status_code`)

describe('lib/util/status_code', () => {
  context('.isOk', () => {
    it('numbers starting with 2xx and 3xx returns true', () => {
      return [200, 300, 301, 299, 302, 201, '200', '300'].forEach((code) => {
        expect(statusCode.isOk(code), `expected status code: ${code} to be true`).to.be.true
      })
    })

    it('numbers not starting with 2xx or 3xx returns false', () => {
      return [100, 400, 401, 500, 404, 503, '200a', '300b'].forEach((code) => {
        expect(statusCode.isOk(code), `expected status code: ${code} to be false`).to.be.false
      })
    })
  })

  context('.getText', () => {
    it('is OK', () => {
      expect(statusCode.getText(200)).to.eq('OK')
    })

    it('is Not Found', () => {
      expect(statusCode.getText(404)).to.eq('Not Found')
    })

    it('is Server Error', () => {
      expect(statusCode.getText(500)).to.eq('Internal Server Error')
    })

    it('is Unknown Status Code', () => {
      expect(statusCode.getText(1234)).to.eq('Unknown Status Code')
    })
  })
})
