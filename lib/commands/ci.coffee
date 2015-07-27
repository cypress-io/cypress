_    = require("lodash")
path = require("path")
os   = require("os")

class Ci
  constructor: (options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(projectRoot, options)

    @projectRoot = process.cwd()

module.exports = Ci