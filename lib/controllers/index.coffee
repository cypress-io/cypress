module.exports = (app) ->
  xhrs:           require("./xhrs")(app)
  files:          require("./files")(app)
  builds:         require("./builds")(app)
  proxy:          require("./proxy")(app)
  specProcessor:  require("./spec_processor")(app)