compression = require("compression")
e2e = require("../support/helpers/e2e")
Fixtures = require("../support/helpers/fixtures")
path = require("path")

PORT = 9876

## based off of the most common encodings used on the Internet:
## https://w3techs.com/technologies/overview/character_encoding/all
## as of this writing, these tests will cover ~99% of websites
TEST_ENCODINGS = [
  "iso-8859-1"
  "euc-kr"
  "shift-jis"
  "gb2312"
]

e2ePath = Fixtures.projectPath("e2e")

fullController = (charset) ->
  (req, res) ->
    res.set({ 'content-type': "text/html;charset=#{charset}" });
    res.sendFile(path.join(e2ePath, "static/charsets/#{charset}.html"))

pageOnlyController = (charset) ->
  (req, res) ->
    res.set()
    res.sendFile(path.join(e2ePath, "static/charsets/#{charset}.html"), {
      headers: { 'content-type': "text/html" }
    })

describe "e2e interception spec", ->
  e2e.setup
    servers: [
      {
        onServer: (app) ->
          TEST_ENCODINGS.forEach (enc) ->
            app.get "/#{enc}.html", fullController(enc)

            app.use "/#{enc}.html.gz", compression()
            app.get "/#{enc}.html.gz", fullController(enc)

            app.get "/#{enc}.html.pageonly", pageOnlyController(enc)

            app.use "/#{enc}.html.gz.pageonly", compression()
            app.get "/#{enc}.html.gz.pageonly", pageOnlyController(enc)

        port: PORT
      }
    ]

  context "character encodings", ->
    ## https://github.com/cypress-io/cypress/issues/1543
    it "does not mangle non-UTF-8 text", ->
      e2e.exec(@, {
        spec: "character_encoding_spec.js"
        config: {
          defaultCommandTimeout: 100
          baseUrl: "http://localhost:9876"
        }
        snapshot: true
        expectedExitCode: 0
        exit: false
      })
