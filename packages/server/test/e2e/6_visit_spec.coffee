_         = require("lodash")
Bluebird  = require("bluebird")
cert      = require("https-pem")
https     = require("https")
useragent = require("express-useragent")
{ allowDestroy } = require("@packages/network")
e2e       = require("../support/helpers/e2e")

## create an HTTPS server that forces TLSv1
startTlsV1Server = (port) ->
  Bluebird.fromCallback (cb) ->
    opts = _.merge({
      secureProtocol: "TLSv1_server_method",
    }, cert)

    serv = https.createServer opts, (req, res) =>
      res.setHeader('content-type', 'text/html')
      res.end('foo')

    allowDestroy(serv)

    serv.listen port, (err) =>
      cb(null, serv)

    serv.on('error', cb)

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

    ## this tests that hashes are applied during a visit
    ## which forces the browser to scroll to the div
    ## additionally this tests that jquery.js is not truncated
    ## due to __cypress.initial cookies not being cleared by
    ## the hash.html response

    ## additionally this tests that xhr request headers + body
    ## can reach the backend without being modified or changed
    ## by the cypress proxy in any way
    e2e.it "passes", {
      spec: "visit_spec.coffee"
      snapshot: true
      expectedExitCode: 0
      onRun: (exec) ->
        startTlsV1Server(6776)
        .then (serv) ->
          exec()
          .then ->
            serv.destroy()
    }

    e2e.it "fails when network connection immediately fails", {
      spec: "visit_http_network_error_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    }

    e2e.it "fails when server responds with 500", {
      spec: "visit_http_500_response_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    }

    e2e.it "fails when file server responds with 404", {
      spec: "visit_file_404_response_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    }

    e2e.it "fails when content type isnt html", {
      spec: "visit_non_html_content_type_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 1
    }

    e2e.it "calls onBeforeLoad when overwriting cy.visit", {
      spec: "issue_2196_spec.coffee"
    }

  context "low responseTimeout, normal pageLoadTimeout", ->
    e2e.setup({
      settings: {
        responseTimeout: 2000
      }
      servers: {
        port: 3434,
        static: true,
        onServer: onServer
      }
    })

    e2e.it "fails when response never ends", {
      spec: "visit_response_never_ends_failing_spec.js",
      snapshot: true,
      expectedExitCode: 3
    }

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

    e2e.it "fails when visit times out", {
      spec: "visit_http_timeout_failing_spec.coffee"
      snapshot: true
      expectedExitCode: 2
    }
