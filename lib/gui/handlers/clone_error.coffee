_ = require("lodash")

module.exports = (err) ->
  ## pull off these properties
  obj = _.pick(err, "message", "type", "name", "stack", "fileName", "lineNumber", "columnNumber")

  ## and any own (custom) properties
  ## of the err object
  for own prop, val of err
    obj[prop] = val

  obj