moment   = require("moment")
parser   = require("cookie-parser")
e2e      = require("../support/helpers/e2e")

onServer = (app) ->
  app.use(parser())

  app.get "/logout", (req, res) ->
    res.send("<html>logged out</html>")

  app.get "/foo", (req, res) ->
    console.log "cookies", req.cookies
    res.send(req.cookies)

  app.get "/set", (req, res) ->
    res.cookie("shouldExpire", "now")

    res.send("<html></html>")

  app.get "/expirationRedirect", (req, res) ->
    res.cookie("shouldExpire", "now", {
      ## express maxAge is relative to current time
      ## in seconds
      maxAge: 0
    })

    res.redirect("/logout")

  app.get "/expirationMaxAge", (req, res) ->
    res.cookie("shouldExpire", "now", {
      ## express maxAge is relative to current time
      ## in seconds
      maxAge: 0
    })

    res.send("<html></html>")

  app.get "/expirationExpires", (req, res) ->
    res.cookie("shouldExpire", "now", {
      expires: moment().subtract(1, "day").toDate()
    })

    res.send("<html></html>")

describe "e2e cookies", ->
  e2e.setup({
    servers: {
      port: 2121
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "cookies_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
