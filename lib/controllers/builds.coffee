request     = require("request")
api         = require("../api")
user        = require("../user")

class Builds
  constructor: (app) ->
    if not (@ instanceof Builds)
      return new Builds(app)

    if not app
      throw new Error("Instantiating controllers/proxy requires an app!")

    @app = app

  handleBuilds: (req, res, next) ->
    user.get().then (user) =>
      api.getBuilds(
        @app.get("cypress").projectId,
        user?.session_token
      )
      ## should we send up the error here?
      ## yes most likely, so dont issue next
      ## just send up the error and respond
      ## back with 500 to the user
      .on("error", next)
      .pipe(res)

module.exports = Builds