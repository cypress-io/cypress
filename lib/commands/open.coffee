utils   = require("../utils")

class Open
  constructor: ->
    if not (@ instanceof Open)
      return new Open

    @open()

  open: ->
    utils.spawn(null, {
      xvfb: false
      detached: true
      stdio: ["ignore", "ignore", "ignore"]
    })

module.exports = Open