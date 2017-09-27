{ $, _ } = window.testUtils

describe "$Cypress.Cy Server API", ->
  beforeEach ->
    @iframe = $("<iframe />").appendTo $("body")
    @window = @iframe.prop("contentWindow")

  afterEach ->
    @iframe.remove()

  it ".create", ->
    server = $Cypress.Server.create({})
    expect(server).to.be.instanceof $Cypress.Server

  it ".defaults", ->
    defaults = _.clone $Cypress.Server.defaults()

    expect(defaults.status).to.eq(200)

    defaults2 = $Cypress.Server.defaults({status: 500})
    expect(defaults2.status).to.eq(500)

    server = $Cypress.Server.create({})
    route = server.route()

    expect(route.status).to.eq(500)

    $Cypress.Server.defaults(defaults)

  context "#isWhitelisted", ->
    beforeEach ->
      @server = $Cypress.Server.create()
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "whitelists GET *.js", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.js"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.jsx", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.jsx"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.html", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.html"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.css", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.css"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.scss", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.scss"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.less", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.less"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.coffee", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.coffee"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.js.coffee", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.js.coffee"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.js?_=123123", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.js?_=123123"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.html?_=123123&foo=bar", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.html?_=123123&foo=bar"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "whitelists GET *.svg", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.svg"
      expect(@server.isWhitelisted(@xhr)).to.be.true

    it "does not whitelist GET *.json?_=123123", ->
      @xhr.method = "GET"
      @xhr.url = "/foo.json?_=123123"
      expect(@server.isWhitelisted(@xhr)).not.to.be.true

    it "does not whitelist OPTIONS *.js?_=123123", ->
      @xhr.method = "OPTIONS"
      @xhr.url = "/foo.js?_=123123"
      expect(@server.isWhitelisted(@xhr)).not.to.be.true

  context "#setRequestHeader", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @srh  = @sandbox.spy(@window.XMLHttpRequest.prototype, "setRequestHeader")
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest
      @xhr.open("GET", "/fixtures/app.json")
      @proxy = @server.getProxyFor(@xhr)

    it "sets request.headers", ->
      @proxy.setRequestHeader("foo", "bar")
      expect(@proxy.request.headers).to.deep.eq({foo: "bar"})

    it "appends to request.headers", ->
      @proxy.setRequestHeader("foo", "bar")
      @proxy.setRequestHeader("foo", "baz")
      expect(@proxy.request.headers).to.deep.eq({foo: "bar, baz"})

    it "ignores cypress headers", ->
      @proxy.setRequestHeader("X-Cypress-Delay", 1000)
      expect(@proxy.request.headers).not.to.be.ok

    it "sets proxy request headers from xhr", ->
      @xhr.setRequestHeader("foo", "bar")

      ## the original setRequestHeaders method should be called here
      expect(@srh).to.be.calledWith("foo", "bar")
      expect(@proxy.request.headers).to.deep.eq({foo: "bar"})

    ## since we yield the xhrProxy object in tests
    ## we need to call the original xhr's implementation
    ## on setRequestHeaders
    it "calls the original xhr's implementation", ->
      @proxy.setRequestHeader("foo", "bar")
      expect(@srh).to.be.calledWith("foo", "bar")
      expect(@srh).to.be.calledOn(@xhr)

  context "#applyStubProperties", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @srh  = @sandbox.spy(@window.XMLHttpRequest.prototype, "setRequestHeader")
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest
      @xhr.open("GET", "/fixtures/app.json")
      @proxy = @server.getProxyFor(@xhr)

    it "encodes the http header value", ->
      route = {
        response: {"test": "We’ll"}
      }

      @sandbox.spy(@xhr, "setRequestHeader")

      ## this function would previous throw unless
      ## we decoded the value
      @server.applyStubProperties(@xhr, route)

      expect(@xhr.setRequestHeader).to.be.calledWith("X-Cypress-Response", "%7B%22test%22:%22We%E2%80%99ll%22%7D")

  context "#getResponseHeader", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @grh  = @sandbox.spy(@window.XMLHttpRequest.prototype, "getResponseHeader")
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest
      @xhr.open("GET", "/fixtures/app.json")
      @proxy = @server.getProxyFor(@xhr)

    it "calls the original xhr implementation", ->
      @proxy.getResponseHeader("foo")
      expect(@grh).to.be.calledWith("foo")
      expect(@grh).to.be.calledOn(@xhr)

  context "#getAllResponseHeaders", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @garh  = @sandbox.spy(@window.XMLHttpRequest.prototype, "getAllResponseHeaders")
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest
      @xhr.open("GET", "/fixtures/app.json")
      @proxy = @server.getProxyFor(@xhr)

    it "calls the original xhr implementation", ->
      @proxy.getAllResponseHeaders()
      expect(@garh).to.be.calledOnce
      expect(@garh).to.be.calledOn(@xhr)

  context "#setResponseHeaders", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "sets response.headers and responseHeaders", (done) ->
      headers = """
        X-Powered-By: Express
        Vary: Accept-Encoding
        Content-Type: application/json
        Cache-Control: public, max-age=0
        Connection: keep-alive
        Content-Length: 53
      """.split("\n").join('\u000d\u000a')

      @sandbox.stub(@xhr, "getAllResponseHeaders").returns(headers)

      @xhr.open("GET", "/fixtures/app.json")

      proxy = @server.getProxyFor(@xhr)

      @xhr.onload = ->
        expect(proxy.responseHeaders).to.eq(proxy.response.headers)
        expect(proxy.responseHeaders).to.deep.eq({
          "X-Powered-By": "Express"
          "Vary": "Accept-Encoding"
          "Content-Type": "application/json"
          "Cache-Control": "public, max-age=0"
          "Connection": "keep-alive"
          "Content-Length": "53"
        })
        done()

      @xhr.send()

  context "#getFullyQualifiedUrl", ->
    beforeEach ->
      @server = $Cypress.Server.create()

      @expectUrlToEq = (url, url2) =>
        expect(@server.getFullyQualifiedUrl(window, url)).to.eq(url2)

    it "resolves absolute relative links", ->
      @expectUrlToEq("/foo/bar.html", "#{window.location.origin}/foo/bar.html")

    it "resolves relative links", ->
      ## slice off the last path segment since this is a relative link
      ## http://localhost:3500/specs/api/cypress/server_spec -> http://localhost:3500/specs/api/cypress
      path = window.location.origin + window.location.pathname.split("/").slice(0, -1).join("/")
      @expectUrlToEq("foo/bar.html", "#{path}/foo/bar.html")

  context "#urlsMatch", ->
    beforeEach ->
      @server = $Cypress.Server.create({
        stripOrigin: (url) ->
          location = $Cypress.Location.create(url)
          url.replace(location.origin, "")
      })

      @matches = (url1, url2) ->
        expect(@server.urlsMatch(url1, url2)).to.be.true

      @notMatches = (url1, url2) ->
        expect(@server.urlsMatch(url1, url2)).to.be.false

    it "matches fully qualified route", ->
      @matches("http://localhost:2020/foo", "http://localhost:2020/foo")

    it "matches absolute relative route", ->
      @matches("/foo", "http://localhost:2020/foo")

    it "prepends with forward slash on glob", ->
      @matches("foo/bar", "http://localhost:2020/foo/bar")

    it "uses default urlMatchingOptions", ->
      ## test that matchBase is true by default
      expect(@server.options.urlMatchingOptions).to.deep.eq({matchBase: true})

      @matches("foo", "http://localhost:2020/a/b/c/foo")

    it "prepends with forward slash", ->
      @matches("foo/*", "http://localhost:2020/foo/123")

    it "use glob stars", ->
      @matches("/users/**", "https://localhost:2020/users/foo/bar?a=1")

    it "use glob stars between url segments", ->
      @matches("/users/*/comments/*", "http://localhost:2020/users/1/comments/2")

    it "matches with regex", ->
      @matches(/foo/, "http://localhost:2020/foo/bar/baz/123")

  context "XHR#abort", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
        onXhrAbort: ->
        onAnyAbort: ->
      })
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "sets aborted=true", ->
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(@xhr.aborted).to.eq(true)

    it "calls the original abort", ->
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(@abort).to.be.calledOn(@xhr)

    it "calls onXhrAbort callback with xhr + stack trace", ->
      @sandbox.stub(@server, "getStack").returns("foobarbaz")
      onXhrAbort = @sandbox.spy @server.options, "onXhrAbort"
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(onXhrAbort).to.be.calledWith(@server.getProxyFor(@xhr), "foobarbaz")

    it "calls onAnyAbort callback with route + xhr", ->
      onAnyAbort = @sandbox.spy @server.options, "onAnyAbort"

      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(onAnyAbort).to.be.called

#   context "XHR#open", ->
#     beforeEach ->
#       @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
#       @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#       })
#       @server.bindTo(@window)
#       @xhr = new @window.XMLHttpRequest

#     it "adds to server#xhrs", ->
#       expect(@server.xhrs).to.deep.eq({})
#       @xhr.open("GET", "/foo")
#       expect(@server.xhrs[@xhr.id]).to.eq(@xhr)

#     it "normalizes async", ->
#       @xhr.open("GET", "/foo")
#       expect(@open).to.be.calledWith("GET", "/foo", true)

#     it "changes url to stub url", ->
#       @sandbox.stub(@server, "shouldApplyStub").returns(true)
#       @xhr.open("GET", "/foo")
#       expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo")

#     it "calls the original open", ->
#       @xhr.open("GET", "/foo", true, "us", "pw")
#       expect(@open).to.be.calledOn(@xhr)
#       expect(@open).to.be.calledWith("GET", "/foo", true, "us", "pw")

#   context "XHR#send", ->
#     beforeEach ->
#       @send = @sandbox.spy(@window.XMLHttpRequest.prototype, "send")
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#       })
#       @server.bindTo(@window)
#       @xhr = new @window.XMLHttpRequest

#     it "bails if server isnt active"

#     it "sets requestBody on all requests", ->
#       @xhr.open("GET", "/foo")
#       @xhr.send("a=b")
#       proxy = @server.getProxyFor(@xhr)
#       expect(proxy.requestBody).to.eq("a=b")
#       expect(proxy.request.body).to.eq("a=b")

#     it "parses requestBody into JSON", ->
#       @xhr.open("POST", "/users")
#       @xhr.send(JSON.stringify({foo: "bar"}))
#       proxy = @server.getProxyFor(@xhr)
#       expect(proxy.requestBody).to.deep.eq({foo: "bar"})
#       expect(proxy.request.body).to.deep.eq({foo: "bar"})

#     it "sets requestBody on formData", ->
#       formData = new FormData
#       formData.append("foo", "bar")
#       formData.append("baz", "quux")

#       @xhr.open("POST", "/form")
#       @xhr.send(formData)

#       proxy = @server.getProxyFor(@xhr)

#       expect(proxy.requestBody).to.eq(formData)

#     it "sets x-cypress-id"

#     it "sets x-cypress-testId"

#     it "calls applyStubProperties", ->
#       @server.enableStubs()

#       applyStubProperties = @sandbox.spy @server, "applyStubProperties"

#       stub1 = @server.stub({
#         method: "POST"
#         url: /.+/
#         response: {}
#         onRequest: ->
#       })

#       stub2 = @server.stub({
#         method: "POST"
#         url: /users/
#         response: {}
#         onRequest: ->
#       })

#       @xhr.open("POST", "/users/123")
#       @xhr.send()

#       expect(applyStubProperties).to.be.calledWith(@xhr, stub2)

#     it "captures send (initiator) stack"

#     it "calls stub.onRequest"

#     it "calls send"

#   context "#applyStubProperties", ->
#     beforeEach ->
#       @setRequestHeader = @sandbox.spy(@window.XMLHttpRequest.prototype, "setRequestHeader")
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#       })
#       @server.bindTo(@window)
#       @stub = @server.stub({
#         method: "POST"
#         url: /foo/
#         delay: 25
#         status: 201
#         headers: {
#           "x-token": "123-abc"
#           "contentType": "foo/bar"
#           "X-Foo-Bar": "sekret"
#         }
#         response: [{name: "b"}, {name: "j"}]
#       })
#       @xhr = new @window.XMLHttpRequest
#       @xhr.open("POST", "foobar")
#       @server.applyStubProperties(@xhr, @stub)

#       @expectRequestHeader = (key, val) =>
#         expect(@setRequestHeader).to.be.calledOn(@xhr)
#         expect(@setRequestHeader).to.be.calledWith("X-Cypress-#{key}", val)

#     it "sets status", ->
#       @expectRequestHeader("Status", 201)

#     it "sets response", ->
#       @expectRequestHeader("Response", JSON.stringify([{name: "b"}, {name: "j"}]))

#     it "sets matched url", ->
#       @expectRequestHeader("Matched", "/foo/")

#     it "sets delay", ->
#       @expectRequestHeader("Delay", 25)

#     it "sets headers", ->
#       headers = JSON.stringify({
#         "x-token": "123-abc"
#         "content-type": "foo/bar"
#         "x-foo-bar": "sekret"
#       })
#       @expectRequestHeader("Headers", headers)

#     it "does not set null/undefined headers", ->
#       @setRequestHeader.reset()

#       stub = @server.stub({
#         method: "POST"
#         url: /foo/
#       })

#       xhr = new @window.XMLHttpRequest
#       xhr.open("POST", "foobar")
#       @server.applyStubProperties(xhr, stub)

#       expect(@setRequestHeader).not.to.be.calledWith("X-Cypress-Headers")

#   context "#stub", ->
#     beforeEach ->
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#         delay: 100
#         waitOnResponses: false
#         foo: "bar"
#       })
#       @server.bindTo(@window)
#       @server.enableStubs()

#     it "merges defaults into stubs", ->
#       expect(@server.stubs).to.be.empty
#       @server.stub({
#         url: /foo/
#         response: {}
#         delay: 50
#       })

#       expect(@server.stubs.length).to.eq(1)
#       expect(@server.stubs[0]).to.deep.eq {
#         url: /foo/
#         response: {}
#         delay: 50
#         method: "GET"
#         status: 200
#         stub: true
#         autoRespond: true
#         waitOnResponses: false
#         onRequest: undefined
#         onResponse: undefined
#       }

#   context "#add", ->
#     beforeEach ->
#       @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
#       @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#       })
#       @server.bindTo(@window)
#       @xhr = new @window.XMLHttpRequest

#     it "sets a unique xhrId", ->
#       @xhr.open("GET", "/")
#       expect(@xhr.id).to.be.a("string")

#     it "merges in attrs", ->
#       @xhr.open("POST", "/bar")
#       expect(@xhr.method).to.eq("POST")
#       expect(@xhr.url).to.include("/bar")

#   context "#deactivate", ->
#     beforeEach ->
#       @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
#       @server = $Cypress.Server.create({
#         xhrUrl: "__cypress/xhrs/"
#       })
#       @server.bindTo(@window)

#     it "sets isActive=false", ->
#       @server.deactivate()
#       expect(@server.isActive).to.be.false

#     it "aborts outstanding requests", (done) ->
#       xhr1 = new @window.XMLHttpRequest
#       xhr2 = new @window.XMLHttpRequest
#       xhr3 = new @window.XMLHttpRequest

#       xhr1.open("GET", "/fixtures/dom.html")
#       xhr2.open("GET", "/timeout?ms=500")
#       xhr3.open("GET", "/timeout?ms=500")

#       xhr1.onload = =>
#         @server.deactivate()

#         ## abort should not have been called
#         ## on xhr1, only xhr2 + xhr3
#         expect(@abort).to.be.calledTwice
#         expect(@abort).to.be.calledOn(xhr2)
#         expect(@abort).to.be.calledOn(xhr3)

#         done()

#       _.invokeMap [xhr1, xhr2, xhr3], "send"

#   context ".whitelist", ->
#     it "ignores whitelisted routes even when matching stub"
  context "#abort", ->
    it "only aborts xhrs which have not already been aborted", ->
      xhrAbort = 0
      anyAbort = 0

      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server.create({
        xhrUrl: "__cypress/xhrs/"
        onXhrAbort: -> xhrAbort += 1
        onAnyAbort: -> anyAbort += 1
      })
      @server.bindTo(@window)

      @xhr1 = new @window.XMLHttpRequest
      @xhr1.open("GET", "/foo")

      @xhr2 = new @window.XMLHttpRequest
      @xhr2.open("GET", "/foo")

      @xhr3 = new @window.XMLHttpRequest
      @xhr3.open("GET", "/foo")

      @xhr1.abort()

      @server.abort()

      expect(xhrAbort).to.eq(3)
      expect(anyAbort).to.eq(3)
