const http = require('http')
const isOkStatusCodeRe = /^[2|3]\d+$/

module.exports = {
  isOk (code) {
    return code && isOkStatusCodeRe.test(code)
  },

  getText (code) {
    return http.STATUS_CODES[code] || 'Unknown Status Code'
  },
}
