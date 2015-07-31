utils = require("../utils")

class GetKey
  constructor: ->
    if not (@ instanceof GetKey)
      return new GetKey

    @key()

  key: ->
    utils.spawn("--get-key")

module.exports = GetKey