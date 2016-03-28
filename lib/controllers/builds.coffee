request     = require("request")
api         = require("../api")
user        = require("../user")

module.exports = {
  handle: (req, res, config, next) ->
    user.get().then (user) =>
      api.getBuilds(
        config.projectId,
        user?.session_token
      )
      ## should we send up the error here?
      ## yes most likely, so dont issue next
      ## just send up the error and respond
      ## back with 500 to the user
      .on("error", next)
      .pipe(res)

}