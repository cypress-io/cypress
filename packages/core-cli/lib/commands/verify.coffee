utils   = require("../utils")

class Verify
  constructor: ->
    if not (@ instanceof Verify)
      return new Verify

    @verify()

  verify: (rand) ->
    utils.spawn(null, {verify: true})

module.exports = Verify