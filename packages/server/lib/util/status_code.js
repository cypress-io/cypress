const { getReasonPhrase } = require('http-status-codes')
const isOkStatusCodeRe = /^[2|3]\d+$/

module.exports = {
  isOk (code) {
    return code && isOkStatusCodeRe.test(code)
  },

  getText (code) {
    try {
      return getReasonPhrase(code)
    } catch (e) {
      return 'Unknown Status Code'
    }
  },
}
