_    = require("lodash")
path = require("path")
os   = require("os")

class Ci
  constructor: (key options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(key, options)

    @key = key

module.exports = Ci