utils   = require("../utils")

class Path
  constructor: ->
    if not (@ instanceof Path)
      return new Path

    @path()

  path: ->
    utils.getCypressPath()

module.exports = Path