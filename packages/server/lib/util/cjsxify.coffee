## wrapper for cjsxify to prevent coffee script from rewriting Error.prepareStackTrace

## hold onto the original
prepareStackTrace = Error.prepareStackTrace

cjsxify = require("cjsxify")

## restore
Error.prepareStackTrace = prepareStackTrace

module.exports = cjsxify
