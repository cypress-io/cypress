_        = require("lodash")
debug    = require("debug")("network-error-handling-spec")
moment   = require("moment")
parser   = require("cookie-parser")
Promise  = require("bluebird")
chrome   = require("../../lib/browsers/chrome")
e2e      = require("../support/helpers/e2e")
launcher = require("@packages/launcher")
random   = require("../../lib/util/random")

PORT = 13370

start = Number(new Date())

getElapsed = ->
  Math.round((Number(new Date()) - start)/1000)

retryTimeout = null
retryTimeoutCallback = null

counts = {
  immediateReset: 0
  afterHeadersReset: 0
  duringBodyReset: 0
}

launchBrowser = (url) ->
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

    launcher.launch(browser, url, args)

clearRetryTimeout = () ->
  clearTimeout(retryTimeout)

resetRetryTimeout = (timeout = 65000) ->
  clearRetryTimeout()
  retryTimeout = setTimeout () ->
    debug("retry timeout reached")
    retryTimeoutCallback()
  , timeout

onServer = (app) ->
  app.get "/works-third-time", (req, res) ->
    id = req.params.id
    count += 1
    if count == 3
      return res.send('ok')
    req.socket.destroy()

describe "e2e network error handling", ->
  e2e.setup({
    servers: [
      {
        onServer: (app) ->
          app.use (req, res, next) ->
            debug('received request %o', {
              counts: counts,
              elapsedTime: getElapsed(),
            })
            resetRetryTimeout()
            next()

          app.get "/immediate-reset", (req, res) ->
            counts.immediateReset++
            req.socket.destroy()

          app.get "/after-headers-reset", (req, res) ->
            counts.afterHeadersReset++
            res.writeHead(200)
            res.write('')
            setTimeout ->
              req.socket.destroy()
            , 1000

          app.get "/during-body-reset", (req, res) ->
            counts.duringBodyReset++
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

  context "in Chrome", ->
    @timeout(240000)

    afterEach ->
      clearRetryTimeout()
      retryTimeoutCallback = null

    it "retries 3+ times with immediate reset", ->
      launchBrowser("http://127.0.0.1:#{PORT}/immediate-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          retryTimeoutCallback = cb
        .timeout(180000)
        .catchReturn(Promise.TimeoutError)
        .then ->
          proc.kill(9)
          expect(counts.immediateReset).to.eq(7)

    it "retries 3+ times with reset after headers", ->
      launchBrowser("http://localhost:#{PORT}/after-headers-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          retryTimeoutCallback = cb
        .timeout(180000)
        .catchReturn(Promise.TimeoutError)
        .then ->
          proc.kill(9)
          expect(counts.immediateReset).to.be(7)

    it "does not retry if reset during body", ->
      launchBrowser("http://localhost:#{PORT}/during-body-reset")
      .then (proc) ->
        Promise.fromCallback (cb) ->
          retryTimeoutCallback = cb
        .then ->
          proc.kill(9)
          expect(counts.duringBodyReset).to.eq(1)

  # it "fails", ->
  #   e2e.exec(@, {
  #     spec: "network_error_handling_spec.js"
  #     snapshot: true
  #     expectedExitCode: 1
  #   })
