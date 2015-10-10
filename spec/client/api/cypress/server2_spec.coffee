describe "$Cypress.Cy Server2 API", ->
  beforeEach ->
    @iframe = $("<iframe />").appendTo $("body")
    @window = @iframe.prop("contentWindow")

  afterEach ->
    @iframe.remove()

  it ".create", ->
    server = $Cypress.Server2.create(@window, {})
    expect(server).to.be.instanceof $Cypress.Server2

  context "XHR#abort", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server2.create(@window, {
        xhrUrl: "__cypress/xhrs/"
      })
      @xhr = new @window.XMLHttpRequest

    it "sets aborted=true", ->
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(@xhr.aborted).to.eq(true)

    it "calls the original abort", ->
      @xhr.open("GET", "/foo")
      @xhr.abort()
      expect(@abort).to.be.calledOn(@xhr)

  context "XHR#open", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @server = $Cypress.Server2.create(@window, {
        xhrUrl: "__cypress/xhrs/"
      })
      @xhr = new @window.XMLHttpRequest

    it "adds to server#xhrs", ->
      expect(@server.xhrs).to.deep.eq({})
      @xhr.open("GET", "/foo")
      expect(@server.xhrs[@xhr.id]).to.eq(@xhr)

    it "normalizes stub url and async", ->
      @xhr.open("GET", "/foo")
      expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo", true)

    it "calls the original open", ->
      @xhr.open("GET", "/foo", true, "us", "pw")
      expect(@open).to.be.calledOn(@xhr)
      expect(@open).to.be.calledWith("GET", "/__cypress/xhrs/foo", true, "us", "pw")

  context "#add", ->
    beforeEach ->
      @send = @sandbox.stub(@window.XMLHttpRequest.prototype, "send")
      @open = @sandbox.spy(@window.XMLHttpRequest.prototype, "open")
      @server = $Cypress.Server2.create(@window, {
        xhrUrl: "__cypress/xhrs/"
      })
      @xhr = new @window.XMLHttpRequest

    it "sets a unique xhrId", ->
      @xhr.open("GET", "/")
      expect(@xhr.id).to.be.a("string")

    it "merges in attrs", ->
      @xhr.open("POST", "/bar")
      expect(@xhr.method).to.eq("POST")
      expect(@xhr.url).to.include("/bar")

  context "#restore", ->
    beforeEach ->
      @abort = @sandbox.spy(@window.XMLHttpRequest.prototype, "abort")
      @server = $Cypress.Server2.create(@window, {
        xhrUrl: "__cypress/xhrs/"
      })

    it "sets isActive=false", ->
      @server.restore()
      expect(@server.isActive).to.be.false

    it "aborts outstanding requests", (done) ->
      xhr1 = new @window.XMLHttpRequest
      xhr2 = new @window.XMLHttpRequest
      xhr3 = new @window.XMLHttpRequest

      xhr1.open("GET", "/fixtures/html/dom.html")
      xhr2.open("GET", "/timeout?ms=500")
      xhr3.open("GET", "/timeout?ms=500")

      xhr1.onload = =>
        @server.restore()

        ## abort should not have been called
        ## on xhr1, only xhr2 + xhr3
        expect(@abort).to.be.calledTwice
        expect(@abort).to.be.calledOn(xhr2)
        expect(@abort).to.be.calledOn(xhr3)

        done()

      _.invoke [xhr1, xhr2, xhr3], "send"

