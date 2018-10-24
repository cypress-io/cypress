// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const stream = require('stream')

module.exports = function (condition, dest) {
  //# if truthy return the dest stream
  if (condition) {
    return dest
  }

  //# else passthrough the stream
  return stream.PassThrough()
}
