utils = require("../utils")

class NewKey
  constructor: ->
    if not (@ instanceof NewKey)
      return new NewKey

    @newKey()

  newKey: ->
    utils.spawn("--new-key")

module.exports = NewKey