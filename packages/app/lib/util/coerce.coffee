_         = require("lodash")
toBoolean = require("underscore.string/toBoolean")

module.exports = (value) ->
  switch
    ## convert to number
    when _.toNumber(value)?.toString() is value
      _.toNumber(value)
    ## convert to boolean
    when toBoolean(value)?.toString() is value
      toBoolean(value)
    else
      value
