request     = require("request")
str         = require("string-to-stream")
Controller  = require("./controller")
Fixtures    = require("../fixtures")

fixturesRe = /^(fx:|fixture:)/

class Xhr extends Controller
  constructor: (app) ->
    if not (@ instanceof Xhr)
      return new Xhr(app)

    if not app
      throw new Error("Instantiating controllers/xhr requires an app!")

    @app = app

    super

  getStream: (resp) ->
    if fixturesRe.test(resp)
      fixture = resp.replace(fixturesRe, "")
      Fixtures(@app).getStream(fixture)
    else
      str(resp)

  handleXhr: (req, res, next) ->
    respond = =>
      res.type("json").status(req.get("x-cypress-status"))

      ## figure out the stream interface and pipe these
      ## chunks to the response
      @getStream(req.get("x-cypress-response")).pipe(res)

    delay = ~~req.get("x-cypress-delay")

    if delay > 0
      Promise.delay(delay).then(respond)
    else
      respond()

module.exports = Xhr