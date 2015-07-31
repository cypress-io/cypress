_    = require("lodash")
path = require("path")
os   = require("os")
run  = require("./run")

class Ci
  constructor: (key, options = {}) ->
    if not (@ instanceof Ci)
      return new Ci(key, options)

    options.key = key

    @ci(options)

  ci: (options) ->
    run null, _.pick(options, "reporter", "key")

module.exports = Ci