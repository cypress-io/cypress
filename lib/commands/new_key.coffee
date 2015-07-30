utils = require("../utils")

class Key
  constructor: ->
    if not (@ instanceof Key)
      return new Key

    @key()

  key: ->
    utils.spawn("--new-key")

module.exports = Key