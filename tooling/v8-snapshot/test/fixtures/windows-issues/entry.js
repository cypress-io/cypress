// @ts-check
'use strict'
// This would cause problems if backslashes aren't properly escaped, resulting in `\u` special char
const unsupported = require('./babel/unsupportedIterableToArray')
module.exports = function () {
  return { unsupported }
}
