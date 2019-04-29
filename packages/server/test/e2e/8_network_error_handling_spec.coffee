_        = require("lodash")
debug    = require("debug")("network-error-handling-spec")
DebugProxy = require("@cypress/debugging-proxy")
Promise  = require("bluebird")
chrome   = require("../../lib/browsers/chrome")
e2e      = require("../support/helpers/e2e")
launcher = require("@packages/launcher")
random   = require("../../lib/util/random")

PORT = 13370

start = Number(new Date())

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
    res.send("<html><body><form method='POST' action='/print-body-third-time/#{req.url}'><input type='text' name='foo'/><input type='submit'/></form></body></html>")

  printBodyThirdTime: (req, res) ->
    if counts[req.url] == 3
      return res.send(req.body)
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

          app.get "/immediate-reset", controllers.immediateReset
          app.get "/after-headers-reset", controllers.afterHeadersReset
          app.get "/during-body-reset", controllers.duringBodyReset
          app.get "/works-third-time/:id", controllers.worksThirdTime
          app.get "/works-third-time-else-500/:id", controllers.worksThirdTimeElse500
          app.post "/print-body-third-time", controllers.printBodyThirdTime

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
        # snapshot: true
        exit: false
        browser: "chrome"
        video: false
        expectedExitCode: 2
      }).then () ->
        expect(counts).to.deep.eq({
          "/immediate-reset?visit": 5
          "/immediate-reset?request": 5
          "/immediate-reset?load-img": 10
          "/immediate-reset?load-js": 10
          "/works-third-time-else-500/500-for-request": 3
          "/works-third-time/for-request": 3
          "/works-third-time-else-500/500-for-visit": 3
          "/works-third-time/for-visit": 3
          "/load-img-net-error.html": 1
          "/load-script-net-error.html": 1
        })
