utils   = require("../utils")

class Test
  constructor: ->
    if not (@ instanceof Test)
      return new Test

    @test()

  test: (rand) ->
    utils.spawn(null, {test: true})

module.exports = Test