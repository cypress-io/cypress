useragent = require("express-useragent")
Fixtures  = require("../support/helpers/fixtures")
e2e       = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/agent.json", (req, res) ->
    source = req.headers["user-agent"] ? ""

    ua = useragent.parse(source)

    res.send({agent: ua})

  app.get "/agent.html", (req, res) ->
    source = req.headers["user-agent"] ? ""

    ua = useragent.parse(source)

    res.send("""
      <html>
        <a href='/agent.html'>agent</a>
        <div id="agent">
          #{JSON.stringify(ua)}
        </div>
      </html
    """)

  app.get "/headers.html", (req, res) ->
    res.send("""
      <html>
        <div id="headers">
          #{JSON.stringify(req.headers)}
        </div>
      </html>
    """)

  app.get "/fail", (req, res) ->
    res.sendStatus(500)

  app.get "/timeout", (req, res) ->
    ms = req.query.ms ? 0

    setTimeout ->
      res.send("<html>timeout: <span>#{ms}</span></html>")
    , ms

  app.get "/response_never_finishes", (req, res) ->
    ## dont ever end this response
    res.type("html").write("foo\n")

describe "e2e visit", ->
  require("mocha-banner").register()
  
  context "low response timeout", ->
    e2e.setup({
      settings: {
        responseTimeout: 500
        pageLoadTimeout: 1000
      }
      servers: {
        port: 3434
        static: true
        onServer: onServer
      }
    })

    it "passes", ->
      ## this tests that hashes are applied during a visit
      ## which forces the browser to scroll to the div
      ## additionally this tests that jquery.js is not truncated
      ## due to __cypress.initial cookies not being cleared by
      ## the hash.html response

      ## additionally this tests that xhr request headers + body
      ## can reach the backend without being modified or changed
      ## by the cypress proxy in any way

      e2e.exec(@, {
        spec: "visit_spec.coffee"
        snapshot: true
        expectedExitCode: 0
      })

    it "fails when network connection immediately fails", ->
      e2e.exec(@, {
        spec: "visit_http_network_error_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 1
      })

    it "fails when server responds with 500", ->
      e2e.exec(@, {
        spec: "visit_http_500_response_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 1
      })

    it "fails when file server responds with 404", ->
      e2e.exec(@, {
        spec: "visit_file_404_response_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 1
      })

    it "fails when content type isnt html", ->
      e2e.exec(@, {
        spec: "visit_non_html_content_type_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 1
      })

  context "normal response timeouts", ->
    e2e.setup({
      settings: {
        pageLoadTimeout: 1000
      }
      servers: {
        port: 3434
        static: true
        onServer: onServer
      }
    })

    it "fails when visit times out", ->
      e2e.exec(@, {
        spec: "visit_http_timeout_failing_spec.coffee"
        snapshot: true
        expectedExitCode: 2
      })
