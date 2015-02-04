module.exports = (app) ->
  remoteProxy:    require("./remote_proxy")(app)
  remoteInitial:  require("./remote_initial")(app)
  specProcessor:  require("./spec_processor")(app)