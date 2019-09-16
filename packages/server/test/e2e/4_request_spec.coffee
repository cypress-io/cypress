bodyParser   = require("body-parser")
cookieParser = require("cookie-parser")
e2e          = require("../support/helpers/e2e")

counts = {
  "localhost:2290": 0
  "localhost:2291": 0
  "localhost:2292": 0
  "localhost:2293": 0
}

urlencodedParser = bodyParser.urlencoded({ extended: false })
jsonParser       = bodyParser.json()

sendBackBody = (req, res) ->
  ## send back to the body
  res.json(req.body)

onServer3 = (app) ->
  app.get "/login", (req, res) ->
    res.cookie("session", "1")

    res.send("<html>login</html>")

  app.post "/login", (req, res) ->
    res.cookie("session", "2")

    res.redirect("/cookies")

  app.get "/cookies", (req, res) ->
    res.json({
      cookie: req.headers.cookie
    })

onServer2 = (app) ->
  app.get "/statusCode", (req, res) ->
    code = req.query.code

    res.sendStatus(code)

  app.get "/params", (req, res) ->
    res.json({
      url: req.url
      params: req.query
    })

  app.get "/redirect", (req, res) ->
    res.redirect("/home")

  app.get "/home", (req, res) ->
    res.send("<html>home</html>")

  app.post "/redirectPost", (req, res) ->
    res.redirect("/home")

  app.get "/headers", (req, res) ->
    res.json({
      headers: req.headers
    })

  app.post "/form", urlencodedParser, sendBackBody

  app.post "/json", jsonParser, sendBackBody

onServer = (app) ->
  app.use(cookieParser())

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
    }, {
      port: 2294
      onServer: onServer2
    }, {
      port: 2295
      onServer: onServer3
    }]
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "request_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })

  it "fails when network immediately fails", ->
    e2e.exec(@, {
      spec: "request_http_network_error_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    })

  it "fails on status code", ->
    e2e.exec(@, {
      spec: "request_status_code_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
      onStdout: (stdout) ->
        stdout
        .replace(/"user-agent": ".+",/, '"user-agent": "foo",')
        .replace(/"etag": "(.+),/, '"etag": "W/13-52060a5f",')
        .replace(/"date": "(.+),/, '"date": "Fri, 18 Aug 2017 15:01:13 GMT",')
    })

  it "prints long http props on fail", ->
    e2e.exec(@, {
      spec: "request_long_http_props_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
      onStdout: (stdout) ->
        stdout
        .replace(/"user-agent": ".+",/, '"user-agent": "foo",')
        .replace(/"etag": "(.+),/, '"etag": "W/13-52060a5f",')
        .replace(/"date": "(.+),/, '"date": "Fri, 18 Aug 2017 15:01:13 GMT",')
    })
