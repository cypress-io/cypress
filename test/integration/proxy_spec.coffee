require("../spec_helper")

# process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

Promise     = require("bluebird")
proxy       = require("../helpers/proxy")
httpServer  = require("../helpers/http_server")
httpsServer = require("../helpers/https_server")

describe "Proxy", ->
  beforeEach ->
    Promise.join(
      httpServer.start()
      .then (@httpSrv) =>

      httpsServer.start()
      .then (@httpsSrv) =>

      proxy.start()
      .then (@prx) =>
    )

  afterEach ->
    Promise.join(
      httpServer.stop()
      httpsServer.stop()
      proxy.stop()
    )

  it "can boot the httpsServer", ->
    request({
      strictSSL: false
      url: "https://localhost:8443/"
      # proxy: "http://localhost:2222"
    })

    .then (html) ->
      expect(html).to.include("https server")

  it "can boot the httpServer", ->
    request({
      strictSSL: false
      url: "http://localhost:8080/"
      proxy: "http://localhost:2222"
    })
    .then (html) ->
      expect(html).to.include("http server")