_ = require("lodash")
$utils = require("./utils")

module.exports = {
  override: (sinon) ->
    sinon._format = $utils.stringifyArg.bind($utils)
  }
