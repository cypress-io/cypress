module.exports = (app) ->
  xhrs:          require("./xhrs")(app)
  files:          require("./files")(app)
  builds:         require("./builds")(app)
  # remoteProxy:    require("./remote_proxy")(app)
  remoteInitial:  require("./remote_initial")(app)
  specProcessor:  require("./spec_processor")(app)