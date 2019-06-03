_        = require("lodash")
express  = require("express")
http     = require("http")
https    = require("https")
path     = require("path")
net      = require("net")
request  = require("request")
stream   = require("stream")
debug    = require("debug")("cypress:server:network-error-handling-spec")
Promise  = require("bluebird")
bodyParser = require("body-parser")
DebugProxy = require("@cypress/debugging-proxy")
mitmProxy = require("http-mitm-proxy")
launcher = require("@packages/launcher")
chrome   = require("../../lib/browsers/chrome")
e2e      = require("../support/helpers/e2e")
random   = require("../../lib/util/random")
Fixtures = require("../support/helpers/fixtures")

PORT = 13370
PROXY_PORT = 13371
HTTPS_PORT = 13372
ERR_HTTPS_PORT = 13373

start = Number(new Date())

e2ePath = Fixtures.projectPath("e2e")

getElapsed = ->
  Math.round((Number(new Date()) - start)/1000)

onVisit = null
counts = {}

launchBrowser = (url, opts = {}) ->
  launcher.detect().then (browsers) ->
    browser = _.find(browsers, { name: 'chrome' })

    args = [
      "--user-data-dir=/tmp/cy-e2e-#{random.id()}"
      ## headless breaks automatic retries
      ## "--headless"
    ].concat(
      chrome._getArgs({
        browser: browser
      })
    ).filter (arg) ->
      ![
        ## seems to break chrome's automatic retries
        "--enable-automation"
      ].includes(arg)

    if opts.withProxy
      args.push("--proxy-server=http://localhost:#{PORT}")

    launcher.launch(browser, url, args)

controllers = {
  loadScriptNetError: (req, res) ->
    res.send('<script type="text/javascript" src="/immediate-reset?load-js"></script>')

  loadImgNetError: (req, res) ->
    res.send('<img src="/immediate-reset?load-img"/>')

  printBodyThirdTimeForm: (req, res) ->
    res.send(
      """
      <html>
        <body>
          <form method='POST' action='/print-body-third-time'>
            <input type='text' name='foo'/>
            <input type='submit'/>
          </form>
        </body>
      </html>
      """
    )

  printBodyThirdTime: (req, res) ->
    console.log(req.body)

    res.type('html')

    if counts[req.url] is 3
      return res.send(JSON.stringify(req.body))

    req.socket.destroy()

  immediateReset: (req, res) ->
    req.socket.destroy()

  afterHeadersReset: (req, res) ->
    res.writeHead(200)
    res.write('')

    setTimeout ->
      req.socket.destroy()
    , 1000

  duringBodyReset: (req, res) ->
    res.writeHead(200)
    res.write('<html>')
    setTimeout ->
      req.socket.destroy()
    , 1000

  worksThirdTime: (req, res) ->
    if counts[req.url] == 3
      return res.send('ok')

    req.socket.destroy()

  worksThirdTimeElse500: (req, res) ->
    if counts[req.url] == 3
      return res.send('ok')

    res.sendStatus(500)

  proxyInternalServerError: (req, res) ->
    res.sendStatus(500)

  proxyBadGateway: (req, res) ->
    ## https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.3
    ## "The server, while acting as a gateway or proxy, received an invalid response"
    res.sendStatus(502)

  proxyServiceUnavailable: (req, res) ->
    ## https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.4
    ## "The implication is that this is a temporary condition which will be alleviated after some delay."
    res.sendStatus(503)

  load304: (req, res) ->
    res.type('html').end('<img src="/static/javascript-logo.png"/>')
}

describe "e2e network error handling", ->
  @timeout(240000)

  e2e.setup({
    servers: [
      {
        onServer: (app) ->
          app.use (req, res, next) ->
            counts[req.url] = _.get(counts, req.url, 0) + 1

            debug('received request %o', {
              counts
              elapsedTime: getElapsed()
              reqUrl: req.url
            })

            if onVisit
              onVisit()

            next()

          app.use("/static", express.static(path.join(e2ePath, 'static')))

          app.use(bodyParser.urlencoded({ extended: true }))

          app.get "/immediate-reset", controllers.immediateReset
          app.get "/after-headers-reset", controllers.afterHeadersReset
          app.get "/during-body-reset", controllers.duringBodyReset
          app.get "/works-third-time/:id", controllers.worksThirdTime
          app.get "/works-third-time-else-500/:id", controllers.worksThirdTimeElse500
          app.post "/print-body-third-time", controllers.printBodyThirdTime

          app.get "/load-304.html", controllers.load304
          app.get "/load-img-net-error.html", controllers.loadImgNetError
          app.get "/load-script-net-error.html", controllers.loadScriptNetError
          app.get "/print-body-third-time-form", controllers.printBodyThirdTimeForm

          app.get "*", (req, res) ->
            ## pretending we're a http proxy
            controller = ({
              "http://immediate-reset.invalid/": controllers.immediateReset
              "http://after-headers-reset.invalid/": controllers.afterHeadersReset
              "http://during-body-reset.invalid/": controllers.duringBodyReset
              "http://proxy-internal-server-error.invalid/": controllers.proxyInternalServerError
              "http://proxy-bad-gateway.invalid/": controllers.proxyBadGateway
              "http://proxy-service-unavailable.invalid/": controllers.proxyServiceUnavailable
            })[req.url]

            if controller
              debug('got controller for request')
              return controller(req, res)

            res.sendStatus(404)

        port: PORT
      }, {
        onServer: (app) ->
          app.use (req, res, next) ->
            counts[req.url] = _.get(counts, req.url, 0) + 1

            debug('received request %o', {
              counts
              elapsedTime: getElapsed()
              reqUrl: req.url
            })

            if onVisit
              onVisit()

            next()

          app.get '/javascript-logo.png', (req, res) ->
            pathToJsLogo = path.join(e2ePath, "static", "javascript-logo.png")

            res.sendFile(pathToJsLogo)

        https: true
        port: HTTPS_PORT
      }
    ],
    settings: {
      baseUrl: "http://localhost:#{PORT}/"
    }
  })

  afterEach ->
    onVisit = null
    counts = {}

  context.skip "Google Chrome", ->
    testRetries = (path) ->
      launchBrowser("http://127.0.0.1:#{PORT}#{path}")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          onVisit = ->
            if counts[path] >= 3
              cb()
        .then ->
          proc.kill(9)
          expect(counts[path]).to.be.at.least(3)

    testNoRetries = (path) ->
      launchBrowser("http://localhost:#{PORT}#{path}")
      .delay(6000)
      .then (proc) ->
        proc.kill(9)
        expect(counts[path]).to.eq(1)

    it "retries 3+ times when receiving immediate reset", ->
      testRetries('/immediate-reset')

    it "retries 3+ times when receiving reset after headers", ->
      testRetries('/after-headers-reset')

    it "does not retry if reset during body", ->
      testNoRetries('/during-body-reset')

    context "behind a proxy server", ->
      testProxiedRetries = (url) ->
        launchBrowser(url, { withProxy: true })
        .then (proc) ->
          Promise.fromCallback (cb) ->
            onVisit = ->
              if counts[url] >= 3
                cb()
          .then ->
            proc.kill(9)
            expect(counts[url]).to.be.at.least(3)

      testProxiedNoRetries = (url) ->
        launchBrowser("http://during-body-reset.invalid/", { withProxy: true })
        .delay(6000)
        .then (proc) ->
          proc.kill(9)
          expect(counts[url]).to.eq(1)

      it "retries 3+ times when receiving immediate reset", ->
        testProxiedRetries("http://immediate-reset.invalid/")

      it "retries 3+ times when receiving reset after headers", ->
        testProxiedRetries("http://after-headers-reset.invalid/",)

      it "does not retry if reset during body", ->
        testProxiedNoRetries("http://during-body-reset.invalid/")

      it "does not retry on '500 Internal Server Error'", ->
        testProxiedNoRetries("http://proxy-internal-server-error.invalid/")

      it "does not retry on '502 Bad Gateway'", ->
        testProxiedNoRetries("http://proxy-bad-gateway.invalid/")

      it "does not retry on '503 Service Unavailable'", ->
        testProxiedNoRetries("http://proxy-service-unavailable.invalid/")

  context "Cypress", ->
    beforeEach ->
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY
      delete process.env.NO_PROXY

    afterEach ->
      if @debugProxy
        @debugProxy.stop()
        .then =>
          @debugProxy = null

    it "baseurl check tries 5 times in run mode", ->
      e2e.exec(@, {
        config: {
          baseUrl: "http://never-gonna-exist.invalid"
        }
        snapshot: true
        expectedExitCode: 1
      })

    it "tests run as expected", ->
      e2e.exec(@, {
        spec: "network_error_handling_spec.js"
        video: false
        expectedExitCode: 2
      }).then ({ stdout }) ->
        expect(stdout).to.contain('1) network error handling cy.visit() retries fails after retrying 5x:')
        expect(stdout).to.contain('CypressError: cy.visit() failed trying to load:')
        expect(stdout).to.contain('http://localhost:13370/immediate-reset?visit')
        expect(stdout).to.contain('We attempted to make an http request to this URL but the request failed without a response.')
        expect(stdout).to.contain('We received this error at the network level:')
        expect(stdout).to.contain('> Error: socket hang up')
        expect(stdout).to.contain('2) network error handling cy.request() retries fails after retrying 5x:')
        expect(stdout).to.contain('http://localhost:13370/immediate-reset?request')

        ## sometimes <img>, <script> get retried 2x by chrome instead of 1x

        if counts['/immediate-reset?load-img'] == 10
          counts['/immediate-reset?load-img'] = 5

        if counts['/immediate-reset?load-js'] == 10
          counts['/immediate-reset?load-js'] = 5

        expect(counts).to.deep.eq({
          "/immediate-reset?visit": 5
          "/immediate-reset?request": 5
          "/immediate-reset?load-img": 5
          "/immediate-reset?load-js": 5
          "/works-third-time-else-500/500-for-request": 3
          "/works-third-time/for-request": 3
          "/works-third-time-else-500/500-for-visit": 3
          "/works-third-time/for-visit": 3
          "/print-body-third-time": 3
          "/print-body-third-time-form": 1
          "/load-img-net-error.html": 1
          "/load-script-net-error.html": 1
        })

    it "retries HTTPS passthrough behind a proxy", ->
      ## this tests retrying multiple times
      ## to connect to the upstream server
      ## as well as network errors when the
      ## upstream server is not accessible

      connectCounts = {}

      onConnect = ({ host, port, socket }) ->
        dest = "#{host}:#{port}"

        connectCounts[dest] ?= 0
        connectCounts[dest] += 1

        switch port
          when HTTPS_PORT
            ## this tests network related errors
            ## when we do immediately destroy the
            ## socket and prevent connecting to the
            ## upstream server
            ##
            ## on the 3rd time around, don't destroy the socket.
            if connectCounts["localhost:#{HTTPS_PORT}"] >= 3
              return true

            ## else if this is the 1st or 2nd time destroy the
            ## socket so we retry connecting to the debug proxy
            socket.destroy()

            return false

          when ERR_HTTPS_PORT
            ## always destroy the socket attempting to connect
            ## to the upstream server to test that network errors
            ## are propagated correctly
            socket.destroy()

            return false

          else
            ## pass everything else on to the upstream
            ## server as expected
            return true

      @debugProxy = new DebugProxy({
        onConnect
      })

      @debugProxy
      .start(PROXY_PORT)
      .then =>
        process.env.HTTP_PROXY = "http://localhost:#{PROXY_PORT}"
        process.env.NO_PROXY = "" ## proxy everything including localhost

        e2e.exec(@, {
          spec: "https_passthru_spec.js"
          snapshot: true
          expectedExitCode: 0
        })
        .then ->
          console.log("connect counts are", connectCounts)

          expect(connectCounts["localhost:#{HTTPS_PORT}"]).to.be.gte(3)
          expect(connectCounts["localhost:#{ERR_HTTPS_PORT}"]).to.be.gte(4)

    it "does not connect to the upstream proxy for the SNI server request", ->
      onConnect = sinon.spy ->
        true

      @debugProxy = new DebugProxy({
        onConnect
      })

      @debugProxy
      .start(PROXY_PORT)
      .then =>
        process.env.HTTP_PROXY = "http://localhost:#{PROXY_PORT}"
        process.env.NO_PROXY = "localhost:13373" ## proxy everything except for the irrelevant test

        e2e.exec(@, {
          spec: "https_passthru_spec.js"
          snapshot: true
          expectedExitCode: 0
          config: {
            baseUrl: "https://localhost:#{HTTPS_PORT}"
          }
        })
        .then ->
          expect(onConnect).to.be.calledTwice

          ## 1st request: verifying base url
          expect(onConnect.firstCall).to.be.calledWithMatch({
            host: 'localhost'
            port: HTTPS_PORT
          })

          ## 2nd request: <img> load from spec
          expect(onConnect.secondCall).to.be.calledWithMatch({
            host: 'localhost'
            port: HTTPS_PORT
          })

    ## https://github.com/cypress-io/cypress/issues/4298
    context "does not delay a 304 Not Modified", ->
      it "in normal network conditions", ->
        e2e.exec(@, {
          spec: "network_error_304_handling_spec.js"
          video: false
          config: {
            baseUrl: "http://localhost:#{PORT}"
            pageLoadTimeout: 4000
          }
          expectedExitCode: 0
          snapshot: true
        })

      it "behind a proxy", ->
        @debugProxy = new DebugProxy()

        @debugProxy
        .start(PROXY_PORT)
        .then =>
          process.env.HTTP_PROXY = "http://localhost:#{PROXY_PORT}"
          process.env.NO_PROXY = ""
        .then =>
          e2e.exec(@, {
            spec: "network_error_304_handling_spec.js"
            video: false
            config: {
              baseUrl: "http://localhost:#{PORT}"
              pageLoadTimeout: 4000
            }
            expectedExitCode: 0
            snapshot: true
          })

      it "behind a proxy with transfer-encoding: chunked", ->
        mitmProxy = mitmProxy()

        mitmProxy.onRequest (ctx, callback) ->
          callback()

        mitmProxy.listen({
          host: '127.0.0.1'
          port: PROXY_PORT
          keepAlive: true
          httpAgent: http.globalAgent
          httpsAgent: https.globalAgent
          forceSNI: false
          forceChunkedRequest: true
        })

        process.env.HTTP_PROXY = "http://localhost:#{PROXY_PORT}"
        process.env.NO_PROXY = ""

        e2e.exec(@, {
          spec: "network_error_304_handling_spec.js"
          video: false
          config: {
            baseUrl: "http://localhost:#{PORT}"
            pageLoadTimeout: 4000
          }
          expectedExitCode: 0
          snapshot: true
        })
