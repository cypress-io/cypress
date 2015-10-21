describe "$Cypress.Cy Server2 API", ->
  beforeEach ->
    @iframe = $("<iframe />").appendTo $("body")
    @window = @iframe.prop("contentWindow")

  afterEach ->
    @iframe.remove()

  it ".create", ->
    server = $Cypress.Server2.create({})
    expect(server).to.be.instanceof $Cypress.Server2

  context "XHR#abort", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
        onAbort: ->
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

    it "calls onAbort callback with xhr + stack trace", ->
      @sandbox.stub(@server, "getStack").returns("foobarbaz")
      onAbort = @sandbox.spy @server.options, "onAbort"
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(onAbort).to.be.calledWith(@server.getProxyFor(@xhr), "foobarbaz")

  context "XHR#open", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "adds to server#xhrs", ->
      expect(@server.xhrs).to.deep.eq({})
      @xhr.open("GET", "/foo")
      expect(@server.xhrs[@xhr.id]).to.eq(@xhr)

    it "normalizes async", ->
      @xhr.open("GET", "/foo")
      expect(@open).to.be.calledWith("GET", "/foo", true)

    it "changes url to stub url", ->
      @sandbox.stub(@server, "getStubForXhr").returns({})
      @xhr.open("GET", "/foo")
      expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo")

    it "calls the original open", ->
      @xhr.open("GET", "/foo", true, "us", "pw")
      expect(@open).to.be.calledOn(@xhr)
      expect(@open).to.be.calledWith("GET", "/foo", true, "us", "pw")

  context "XHR#send", ->
    beforeEach ->
      @send = @sandbox.spy(@window.XMLHttpRequest.prototype, "send")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "bails if server isnt active"

    it "sets requestBody on all requests", ->
      @xhr.open("GET", "/foo")
      @xhr.send("a=b")
      expect(@xhr.requestBody).to.eq("a=b")

    it "sets requestJSON on all requests", ->
      @xhr.open("POST", "/users")
      @xhr.send(JSON.stringify({foo: "bar"}))
      expect(@xhr.requestJSON).to.deep.eq({foo: "bar"})

    it "does not set requestJSON on formData", ->
      formData = new FormData
      formData.append("foo", "bar")
      formData.append("baz", "quux")

      @xhr.open("POST", "/form")
      @xhr.send(formData)

      expect(@xhr.requestBody).to.eq(formData)
      expect(@xhr.requestJSON).to.be.undefined

    it "sets x-cypress-id"

    it "sets x-cypress-testId"

    it "calls applyStubProperties", ->
      @server.enableStubs()

      applyStubProperties = @sandbox.spy @server, "applyStubProperties"

      stub1 = @server.stub({
        method: "POST"
        url: /.+/
        response: {}
        onRequest: ->
      })

      stub2 = @server.stub({
        method: "POST"
        url: /users/
        response: {}
        onRequest: ->
      })

      @xhr.open("POST", "/users/123")
      @xhr.send()

      expect(applyStubProperties).to.be.calledWith(@xhr, stub2)

    it "captures send (initiator) stack"

    it "calls stub.onRequest"

    it "calls send"

  context "#applyStubProperties", ->
    beforeEach ->
      @setRequestHeader = @sandbox.spy(@window.XMLHttpRequest.prototype, "setRequestHeader")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)
      @stub = @server.stub({
        method: "POST"
        url: /foo/
        delay: 25
        status: 201
        headers: {
          "x-token": "123-abc"
        }
        response: [{name: "b"}, {name: "j"}]
      })
      @xhr = new @window.XMLHttpRequest
      @xhr.open("POST", "foobar")
      @server.applyStubProperties(@xhr, @stub)

      @expectRequestHeader = (key, val) =>
        expect(@setRequestHeader).to.be.calledOn(@xhr)
        expect(@setRequestHeader).to.be.calledWith("X-Cypress-#{key}", val)

    it "sets status", ->
      @expectRequestHeader("Status", 201)

    it "sets response", ->
      @expectRequestHeader("Response", JSON.stringify([{name: "b"}, {name: "j"}]))

    it "sets matched url", ->
      @expectRequestHeader("Matched", "/foo/")

    it "sets delay", ->
      @expectRequestHeader("Delay", 25)

    it "sets headers", ->
      @expectRequestHeader("Headers", JSON.stringify({"x-token": "123-abc"}))

    it.skip "sets isStub=true", ->
      expect(@xhr.isStub).to.be.true

    it "does not set null/undefined headers", ->
      @setRequestHeader.reset()

      stub = @server.stub({
        method: "POST"
        url: /foo/
      })

      xhr = new @window.XMLHttpRequest
      xhr.open("POST", "foobar")
      @server.applyStubProperties(xhr, stub)

      expect(@setRequestHeader).not.to.be.calledWith("X-Cypress-Headers")

  context "#stub", ->
    beforeEach ->
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
        delay: 100
        waitOnResponse: false
        foo: "bar"
      })
      @server.bindTo(@window)
      @server.enableStubs()

    it "merges defaults for delay, status, autoRespond, waitOnResponse and pushes into stubs", ->
      expect(@server.stubs).to.be.empty
      @server.stub({
        url: /foo/
        response: {}
        delay: 50
        autoRespond: undefined
        waitOnResponse: undefined
      })

      expect(@server.stubs.length).to.eq(1)
      expect(@server.stubs[0]).to.deep.eq {
        url: /foo/
        response: {}
        delay: 50
        status: 200
        autoRespond: true
        waitOnResponse: false
      }

  context "#add", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)
      @xhr = new @window.XMLHttpRequest

    it "sets a unique xhrId", ->
      @xhr.open("GET", "/")
      expect(@xhr.id).to.be.a("string")

    it "merges in attrs", ->
      @xhr.open("POST", "/bar")
      expect(@xhr.method).to.eq("POST")
      expect(@xhr.url).to.include("/bar")

  context "#deactivate", ->
    beforeEach ->
      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server2.create({
        xhrUrl: "__cypress/xhrs/"
      })
      @server.bindTo(@window)

    it "sets isActive=false", ->
      @server.deactivate()
      expect(@server.isActive).to.be.false

    it "aborts outstanding requests", (done) ->
      xhr1 = new @window.XMLHttpRequest
      xhr2 = new @window.XMLHttpRequest
      xhr3 = new @window.XMLHttpRequest

      xhr1.open("GET", "/fixtures/html/dom.html")
      xhr2.open("GET", "/timeout?ms=500")
      xhr3.open("GET", "/timeout?ms=500")

      xhr1.onload = =>
        @server.deactivate()

        ## abort should not have been called
        ## on xhr1, only xhr2 + xhr3
        expect(@abort).to.be.calledTwice
        expect(@abort).to.be.calledOn(xhr2)
        expect(@abort).to.be.calledOn(xhr3)

        done()

      _.invoke [xhr1, xhr2, xhr3], "send"

  context ".whitelist", ->
    it "ignores whitelisted routes even when matching stub"