parser   = require("cookie-parser")
e2e      = require("../helpers/e2e")

counts = {
  "localhost:2290": 0
  "localhost:2291": 0
  "localhost:2292": 0
  "localhost:2293": 0
}

onServer = (app) ->
  app.use(parser())

  app.get "/cookies*", (req, res) ->
    res.json(req.cookies)

  app.get "/counts", (req, res) ->
    res.json(counts)

  app.get "*", (req, res) ->
    host = req.get("host")

    counts[host] += 1

    switch host
      when "localhost:2290"
        res
        .cookie("2290", true, {
          path: "/cookies/one"
        })
        .redirect("http://localhost:2291/")

      when "localhost:2291"
        res
        .cookie("2291", true, {
          path: "/cookies/two"
        })
        .redirect("http://localhost:2292/")

      when "localhost:2292"
        res
        .set('Content-Type', 'text/html')
        .cookie("2292", true, {
          path: "/cookies/three"
        })
        .send("<html><head></head><body>hi</body></html>")

      when "localhost:2293"
        res
        .cookie("2293", true, {
          httpOnly: true
          maxAge: 60000
        })
        .cookie("2293-session", true)
        .send({})

describe "e2e requests", ->
  e2e.setup({
    servers: [{
      port: 2290
      onServer: onServer
    },{
      port: 2291
      onServer: onServer
    },{
      port: 2292
      onServer: onServer
    },{
      port: 2293
      onServer: onServer
    }]
  })

  it "passes", ->
    e2e.start(@, {
      spec: "request_spec.coffee"
      expectedExitCode: 0
    })
