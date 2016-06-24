require("../spec_helper")

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

Promise     = require("bluebird")
proxy       = require("../helpers/proxy")
mitmProxy   = require("../helpers/mitm")
httpServer  = require("../helpers/http_server")
httpsServer = require("../helpers/https_server")

describe "Proxy", ->
  beforeEach ->
    Promise.join(
      httpServer.start()

      # mitmProxy.start()

      httpsServer.start(8443)

      httpsServer.start(8444)

      proxy.start(3333)
    )

  afterEach ->
    Promise.join(
      httpServer.stop()
      httpsServer.stop()
      proxy.stop()
    )

  it "can call the httpsDirectly without a proxy", ->
    request({
      strictSSL: false
      url: "https://localhost:8443"
    })

  it "can boot the httpsServer", ->
    request({
      strictSSL: false
      url: "https://localhost:8443/"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("https server")

  it "yields the onRequest callback", ->
    request({
      strictSSL: false
      url: "https://localhost:8443/replace"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("replaced content")

  it "can pass directly through", ->
    ## this will fail due to dynamic cert
    ## generation when strict ssl is true
    request({
      strictSSL: false
      url: "https://localhost:8444/replace"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("https server")

  it "can boot the httpServer", ->
    request({
      strictSSL: false
      url: "http://localhost:8080/"
      proxy: "http://localhost:3333"
    })
    .then (html) ->
      expect(html).to.include("http server")

