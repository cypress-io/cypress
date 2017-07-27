_ = require("lodash")
formatio = require("formatio")
$utils = require("./utils")

formatio.configure = ->
  ascii: $utils.stringifyArg.bind($utils)
