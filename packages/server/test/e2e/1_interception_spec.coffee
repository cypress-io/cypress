compression = require("compression")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
path = require("path")

PORT = 9876

e2ePath = Fixtures.projectPath("e2e")

fullController = (charset) ->
  (req, res) ->
    res.set({ 'content-type': "text/html;charset=#{charset}" });
    res.sendFile(path.join(e2ePath, "#{charset}.html"))

pageOnlyController = (charset) ->
  (req, res) ->
    res.set()
    res.sendFile(path.join(e2ePath, "#{charset}.html"), {
      headers: { 'content-type': "text/html" }
    })

describe "e2e interception spec", ->
  e2e.setup
    servers: [
      {
        onServer: (app) ->
          app.get '/iso-8859-1.html', fullController("iso-8859-1")

          app.use '/iso-8859-1.html.gz', compression()
          app.get '/iso-8859-1.html.gz', fullController("iso-8859-1")

          app.get '/iso-8859-1.html.pageonly', pageOnlyController("iso-8859-1")

          app.use '/iso-8859-1.html.gz.pageonly', compression()
          app.get '/iso-8859-1.html.gz.pageonly', pageOnlyController("iso-8859-1")
        port: PORT
      }
    ]

  context "character encodings", ->
    ## https://github.com/cypress-io/cypress/issues/1543
    it "does not mangle iso-8859-1 text", ->
      e2e.exec(@, {
        spec: "iso-8859-1_spec.js"
        config: {
          defaultCommandTimeout: 100
          baseUrl: "http://localhost:9876"
        }
        snapshot: true
        expectedExitCode: 0
      })
