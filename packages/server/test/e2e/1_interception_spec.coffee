e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
path = require("path")

PORT = 9876

e2ePath = Fixtures.projectPath("e2e")

describe "e2e interception spec", ->
  e2e.setup
    servers: [
      {
        onServer: (app) ->
          app.get '/iso-8859-1.html', (req, res) ->
            res.set({ 'content-type': 'text/html;charset=iso-8859-1' });
            res.sendFile(path.join(e2ePath, 'iso-8859-1.html'))
        port: PORT
      }
    ]

  context "character encodings", ->
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
