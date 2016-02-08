request     = require("request")
api         = require("../api")
cache       = require("../cache")
Controller  = require("./controller")

class Builds extends Controller
  constructor: (app) ->
    if not (@ instanceof Builds)
      return new Builds(app)

    if not app
      throw new Error("Instantiating controllers/remote_initial requires an app!")

    @app = app

    super

  handleBuilds: (req, res, next) ->
    cache.getUser().then (user) =>
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