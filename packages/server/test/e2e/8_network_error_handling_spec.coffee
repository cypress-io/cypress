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
count = 0
e2eCount = {}

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
  immediateReset: (req, res) ->
    count++
    req.socket.destroy()

  afterHeadersReset: (req, res) ->
    count++
    res.writeHead(200)
    res.write('')
    setTimeout ->
      req.socket.destroy()
    , 1000

  duringBodyReset: (req, res) ->
    count++
    res.writeHead(200)
    res.write('<html>')
    setTimeout ->
      req.socket.destroy()
    , 1000

  worksThirdTime: (req, res) ->
    e2eCount[req.params.id] ?= 0
    e2eCount[req.params.id]++
    if e2eCount[req.params.id] == 3
      return res.send('ok')
    req.socket.destroy()

  worksThirdTimeElse500: (req, res) ->
    e2eCount[req.params.id] ?= 0
    e2eCount[req.params.id]++
    if e2eCount[req.params.id] == 3
      return res.send('ok')
    res.sendStatus(500)

  proxyInternalServerError: (req, res) ->
    count++
    res.sendStatus(500)

  proxyBadGateway: (req, res) ->
    count++
    ## https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.3
    ## "The server, while acting as a gateway or proxy, received an invalid response"
    res.sendStatus(502)

  proxyServiceUnavailable: (req, res) ->
    count++
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
            debug('received request %o', {
              count
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
    count = 0

  context "Google Chrome", ->
    it "retries 3+ times when receiving immediate reset", ->
      launchBrowser("http://127.0.0.1:#{PORT}/immediate-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          onVisit = ->
            if count >= 3
              cb()
        .then ->
          proc.kill(9)
          expect(count).to.be.at.least(3)

    it "retries 3+ times when receiving reset after headers", ->
      launchBrowser("http://localhost:#{PORT}/after-headers-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          onVisit = ->
            if count >= 3
              cb()
        .then ->
          proc.kill(9)
          expect(count).to.be.at.least(3)

    it "does not retry if reset during body", ->
      launchBrowser("http://localhost:#{PORT}/during-body-reset")
      .delay(6000)
      .then (proc) ->
        proc.kill(9)
        expect(count).to.eq(1)

    context "behind a proxy server", ->
      it "retries 3+ times when receiving immediate reset", ->
        launchBrowser("http://immediate-reset.invalid/", { withProxy: true })
        .then (proc) ->
          Promise.fromCallback (cb) ->
            onVisit = ->
              if count >= 3
                cb()
          .then ->
            proc.kill(9)
            expect(count).to.be.at.least(3)

      it "retries 3+ times when receiving reset after headers", ->
        launchBrowser("http://after-headers-reset.invalid/", { withProxy: true })
        .then (proc) ->
          Promise.fromCallback (cb) ->
            onVisit = ->
              if count >= 3
                cb()
          .then ->
            proc.kill(9)
            expect(count).to.be.at.least(3)

      it "does not retry if reset during body", ->
        launchBrowser("http://during-body-reset.invalid/", { withProxy: true })
        .delay(6000)
        .then (proc) ->
          proc.kill(9)
          expect(count).to.eq(1)

      it "does not retry on '500 Internal Server Error'", ->
        launchBrowser("http://proxy-internal-server-error.invalid/", { withProxy: true })
        .delay(6000)
        .then (proc) ->
          proc.kill(9)
          expect(count).to.eq(1)

      it "does not retry on '502 Bad Gateway'", ->
        launchBrowser("http://proxy-bad-gateway.invalid/", { withProxy: true })
        .delay(6000)
        .then (proc) ->
          proc.kill(9)
          expect(count).to.eq(1)

      it "does not retry on '503 Service Unavailable'", ->
        launchBrowser("http://proxy-service-unavailable.invalid/", { withProxy: true })
        .delay(6000)
        .then (proc) ->
          proc.kill(9)
          expect(count).to.eq(1)

  context "Cypress", ->
    it "tests run as expected", ->
      e2e.exec(@, {
        spec: "network_error_handling_spec.js"
        snapshot: true
        # exit: false
        # browser: "chrome"
        video: false
        expectedExitCode: 2
      }).then () ->
        expect(count).to.eq(12)
        expect(e2eCount).to.deep.eq({
          "for-request": 3
          "for-visit": 3
          "500-for-request": 3
          "500-for-visit": 3
        })
