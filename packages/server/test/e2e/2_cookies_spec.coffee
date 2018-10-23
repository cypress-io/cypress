moment   = require("moment")
parser   = require("cookie-parser")
e2e      = require("../support/helpers/e2e")
humanInterval = require("human-interval")

onServer = (app) ->
  app.use(parser())

  app.get "/logout", (req, res) ->
    res.send("<html>logged out</html>")

  app.get "/foo", (req, res) ->
    console.log "cookies", req.cookies
    res.send(req.cookies)

  app.get "/set", (req, res) ->
    res.cookie("shouldExpire", "endOfsession")

    res.send("<html></html>")

  app.get "/setOneHourFromNow", (req, res) ->
    res.cookie("shouldExpire", "oneHour", {
      maxAge: humanInterval("1 hour")
    })

    res.send("<html></html>")

  app.get "/expirationRedirect", (req, res) ->
    res.cookie("shouldExpire", "now", {
      ## express maxAge is relative to current time
      ## in milliseconds
      maxAge: 0
    })

    res.redirect("/logout")

  app.get "/expirationMaxAge", (req, res) ->
    res.header("Set-Cookie",
      "shouldExpire=; Max-Age=0; Path=/; Expires=Sun, 24 Jun 1997 20:36:13 GMT"
    )
    #
    # ep201=V8McDWryweRdO/fjuDRd0EP3J1Y=; Domain=.surveymonkey.com; Path=/; Expires=Sun, 24-Jun-18 18:30:18 GMT',
    # 'ep202=UCJ5o/8I2dLSjth95fhgT2yfo74=; Domain=.surveymonkey.com; Path=/; Expires=Sat, 22-Sep-18 18:00:18 GMT', 'auth=v0XpitL9AScwDEz8VeolRJt5OzJR_2Fs6btyZSfP_2BPeH_2FtPGNwvqMfjcSbaasfg0ToQU_2Fj_2BZQ_2FowQxdnBuboJovduHtEYap9YS1KUq4rQeJz6WLLBC84T0yhcwrWAuqOxFtD92KXUE58i_2BmyoBvugOHZNKhZxL_2FV9y_2Bxraf1Cwvw8_3D; Domain=.surveymonkey.com; Max-Age=3600; Path=/; expires=Sun, 24-Jun-2018 19:00:18 GMT; secure; HttpOnly'

    # res.cookie("shouldExpire", null, {
    #   ## express maxAge is relative to current time
    #   ## in milliseconds
    #   maxAge: 0
    # })

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
