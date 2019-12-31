const statuses = require('http-status-codes')

const isOkStatusCodeRe = /^[2|3]\d+$/

module.exports = {
  isOk (code) {
    return code && isOkStatusCodeRe.test(code)
  },

  // TODO: test this method
  getText (code) {
    try {
      return statuses.getStatusText(code)
    } catch (e) {
      return 'Unknown Status Code'
    }
  },
}
