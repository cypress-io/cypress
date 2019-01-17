const contentType = require('content-type')

module.exports = {
  getContentType (res) {
    try {
      return contentType.parse(res).type
    } catch (err) {
      return res.headers['content-type']
    }
  },

  hasContentType (res, type) {
    //# does the response object have a content-type
    //# that matches what we expect
    try {
      return contentType.parse(res).type === type
    } catch (err) {
      return false
    }
  },
}
