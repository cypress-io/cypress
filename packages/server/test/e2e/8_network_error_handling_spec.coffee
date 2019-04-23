_        = require("lodash")
debug    = require("debug")("network-error-handling-spec")
DebugProxy = require("@cypress/debugging-proxy")
moment   = require("moment")
parser   = require("cookie-parser")
Promise  = require("bluebird")
chrome   = require("../../lib/browsers/chrome")
e2e      = require("../support/helpers/e2e")
launcher = require("@packages/launcher")
random   = require("../../lib/util/random")

PORT = 13370
PROXY_PORT = 13371

start = Number(new Date())

getElapsed = ->
  Math.round((Number(new Date()) - start)/1000)

onVisit = null
count = 0

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

    if opts.useProxy
      args.push("--proxy-server=http://localhost:#{PROXY_PORT}")

    launcher.launch(browser, url, args)

onServer = (app) ->
  app.get "/works-third-time", (req, res) ->
    id = req.params.id
    count += 1
    if count == 3
      return res.send('ok')
    req.socket.destroy()

describe "e2e network error handling", ->
  @timeout(240000)

  e2e.setup({
    servers: [
      {
        onServer: (app) ->
          app.use (req, res, next) ->
            debug('received request %o', {
              counts: counts,
              elapsedTime: getElapsed(),
            })

            if onVisit
              onVisit()

            next()

          app.get "/immediate-reset", (req, res) ->
            count++
            req.socket.destroy()

          app.get "/after-headers-reset", (req, res) ->
            count++
            res.writeHead(200)
            res.write('')
            setTimeout ->
              req.socket.destroy()
            , 1000

          app.get "/during-body-reset", (req, res) ->
            count++
            res.writeHead(200)
            res.write('<html>')
            setTimeout ->
              req.socket.destroy()
            , 1000

        port: PORT
      }
    ],
    settings: {
      baseUrl: "http://localhost:13370/"
    }
  })

  before ->
    @proxy = new DebugProxy()
    @proxy.start(PROXY_PORT)

  afterEach ->
    onVisit = null
    count = 0

  context "in Chrome", ->
    it "retries 3+ times with immediate reset", ->
      launchBrowser("http://127.0.0.1:#{PORT}/immediate-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          onVisit = ->
            if counts.immediateReset >= 3
              cb()
        .then ->
          proc.kill(9)
          expect(counts.immediateReset).to.be.at.least(3)

    it "retries 3+ times with reset after headers", ->
      launchBrowser("http://localhost:#{PORT}/after-headers-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          onVisit = ->
            if counts.afterHeadersReset >= 3
              cb()
        .then ->
          proc.kill(9)
          expect(counts.afterHeadersReset).to.be.at.least(3)

    it "does not retry if reset during body", ->
      launchBrowser("http://localhost:#{PORT}/during-body-reset")
      .delay(5000)
      .then (proc) ->
        proc.kill(9)
        expect(counts.duringBodyReset).to.eq(1)

  # it "fails", ->
  #   e2e.exec(@, {
  #     spec: "network_error_handling_spec.js"
  #     snapshot: true
  #     expectedExitCode: 1
  #   })
