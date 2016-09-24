Fixtures = require("../helpers/fixtures")
e2e      = require("../helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  app.get "/fail", (req, res) ->
    res.sendStatus(500)

  app.get "/timeout", (req, res) ->
    ms = req.query.ms ? 0

    setTimeout ->
      res.send("<html>timeout: <span>#{ms}</span></html>")
    , ms

describe "e2e visit", ->
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

  it "passes", ->
    ## this tests that hashes are applied during a visit
    ## which forces the browser to scroll to the div
    ## additionally this tests that jquery.js is not truncated
    ## due to __cypress.initial cookies not being cleared by
    ## the hash.html response

    ## additionally this tests that xhr request headers + body
    ## can reach the backend without being modified or changed
    ## by the cypress proxy in any way

    e2e.start(@, {
      spec: "visit_spec.coffee"
      expectedExitCode: 0
    })

  it "fails when network connection immediately fails", ->
    e2e.exec(@, {
      spec: "visit_http_network_error_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("http://localhost:16795")
      expect(stdout).to.include("We attempted to make an http request to this URL but the request immediately failed without a response.")
      expect(stdout).to.include("> Error: connect ECONNREFUSED 127.0.0.1:16795")

  it "fails when server responds with 500", ->
    e2e.exec(@, {
      spec: "visit_http_500_response_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("http://localhost:3434/fail")
      expect(stdout).to.include("The response we received from your web server was:")
      expect(stdout).to.include("> 500: Server Error")

  it "fails when file server responds with 404", ->

    e2e.exec(@, {
      spec: "visit_file_404_response_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include(Fixtures.projectPath("e2e/static/does-not-exist.html"))
      expect(stdout).to.include("We failed looking for this file at the path:")
      expect(stdout).to.include("The internal Cypress web server responded with:")
      expect(stdout).to.include("> 404: Not Found")

  it "fails when content type isnt html", ->
    e2e.exec(@, {
      spec: "visit_non_html_content_type_failing_spec.coffee"
      expectedExitCode: 1
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("The content-type of the response we received from this local file was:")
      expect(stdout).to.include("> text/plain")

  it.only "fails when visit times out", ->
    e2e.exec(@, {
      spec: "visit_http_timeout_failing_spec.coffee"
      expectedExitCode: 2
    })
    .get("stdout")
    .then (stdout) ->
      expect(stdout).to.include("Your page did not fire its 'load' event within '1000ms'.")
      expect(stdout).to.include("Your page did not fire its 'load' event within '500ms'.")
