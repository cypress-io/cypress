request     = require("request")
Controller  = require("./controller")
cache       = require("../cache")
Routes      = require("../util/routes")

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
      request.get({
        url: Routes.projectCi(@app.get("cypress").projectId)
        headers: {"X-Session": user?.session_token}
        json: true
      })
      ## should we send up the error here?
      ## yes most likely, so dont issue next
      ## just send up the error and respond
      ## back with 500 to the user
      .on("error", next)
      .pipe(res)

module.exports = Builds