fs       = require("fs")
Fixtures = require("../support/helpers/fixtures")
e2e      = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/index.html", (req, res) ->
    res.send("""
      <html>
        <body>
          some bad js a comin'
        </body>
      </html>
    """)

  app.get "/gzip-bad.html", (req, res) ->
    buf = fs.readFileSync(Fixtures.path("server/gzip-bad.html.gz"))

    res.set({
      "content-type": "text/html"
      "content-encoding": "gzip"
    })
    .send(buf)

  app.get "/gzip-bad.js", (req, res) ->
    buf = fs.readFileSync(Fixtures.path("server/gzip-bad.html.gz"))

    res.set({
      "content-type": "application/javascript"
      "content-encoding": "gzip"
    })
    .send(buf)

## FIREFOX FIXME: errors slightly different and stack trace lines not replaced in snapshot
describe "e2e js error handling", ->
  e2e.setup({
    servers: [{
      port: 1122
      static: true
    }, {
      port: 1123
      onServer
    }]
  })

  it "fails", ->
    e2e.exec(@, {
      spec: "js_error_handling_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 5
    })
