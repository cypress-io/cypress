bodyParser   = require("body-parser")
cookieParser = require("cookie-parser")
e2e          = require("../helpers/e2e")

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
    e2e.start(@, {
      spec: "request_spec.coffee"
      expectedExitCode: 0
    })

  it "fails when network immediately fails", ->
    e2e.exec(@, {
      spec: "request_http_network_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("http://localhost:16795")
      expect(stdout).to.include("We attempted to make an http request to this URL but the request failed without a response.")
      expect(stdout).to.include("> Error: connect ECONNREFUSED 127.0.0.1:16795")
      expect(stdout).to.include("The request we sent was:")
      expect(stdout).to.include("Method: GET")
      expect(stdout).to.include("URL: http://localhost:16795")

  it "fails on status code", ->
    e2e.exec(@, {
      spec: "request_status_code_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("http://localhost:2294/statusCode?code=503")
      expect(stdout).to.include("The response we received from your web server was:")
      expect(stdout).to.include("> 503: Service Unavailable")
      expect(stdout).to.include("This was considered a failure because the status code was not '2xx' or '3xx'.")
      expect(stdout).to.include("If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'")
      expect(stdout).to.include("The request we sent was:")
      expect(stdout).to.include("Method: GET")
      expect(stdout).to.include("URL: http://localhost:2294/statusCode?code=503")
      expect(stdout).to.include("Headers: {\n")
      expect(stdout).to.include("user-agent")
      expect(stdout).to.include("\"accept\": \"*/*\"")
      expect(stdout).to.include("The response we got was:")
      expect(stdout).to.include("Status: 503 - Service Unavailable")
      expect(stdout).to.include("x-powered-by\": \"Express\"")
      expect(stdout).to.include("Body: Service Unavailable")
