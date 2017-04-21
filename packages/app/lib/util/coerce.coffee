str = require("underscore.string")

module.exports = (value) ->
  switch
    ## convert to number
    when str.toNumber(value)?.toString() is value
      str.toNumber(value)
    ## convert to boolean
    when str.toBoolean(value)?.toString() is value
      str.toBoolean(value)
    else
      value