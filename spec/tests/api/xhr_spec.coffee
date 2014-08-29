Ecl = new Eclectus

describe "XHR Command API", ->
  beforeEach ->
    @emit = @sandbox.stub(Eclectus.Command.prototype, "emit").returns(null)

    df = $.Deferred()

    _this = @

    $("iframe").remove()

    iframe = $("<iframe />", {
      src: "/fixtures/xhr.html"
      class: "iframe-spec"
      load: ->
        ## sandbox this iframe's contentWindow
        Eclectus.sandbox @contentWindow
        Eclectus.patch {contentWindow: @contentWindow}
        _this.contentWindow = @contentWindow
        df.resolve()
    })

    iframe.appendTo $("body")

    df

  it "sets sandbox for each content window", ->
    expect(Ecl.sandbox).to.exist

  it "creates the sinon XHR server on the sandbox", ->
    Ecl.server()
    expect(Ecl.sandbox).to.have.property "_server"
    expect(Ecl.sandbox).to.have.property "server"

  context "Eclectus XHR", ->
    beforeEach ->
      Ecl.server()
      @server = Ecl.sandbox.server

    it "stores an array of requests", ->
      expect(@server.requests).to.deep.eq []

    it "stores an array of onRequests", ->
      expect(@server.onRequests).to.deep.eq []

    it "inserts xhr into 'requests' for each XHR request", ->
      @contentWindow.$.get "/"
      expect(@server.requests).to.have.length 1

    it "makes requests accessible through Ecl.server", ->
      @contentWindow.$.get "/"
      expect(Ecl.server.requests).to.have.length 1

    it "invokes any onRequest callback functions on the Ecl server", ->
      spy = @sandbox.spy()
      Ecl.server.onRequest spy
      @contentWindow.$.get "/"
      expect(spy).to.be.called

    it "emits the request", ->
      @contentWindow.$.get "/"
      args = @emit.getCall(0).args[0]
      expect(args).deep.eq {
        method: "GET"
        url: "/"
        xhr: @server.requests[0]
      }

    it "inserts a response", ->
      Ecl.server.stub
        method: "GET"
        url: "/"

      expect(@server.server.responses).to.have.length(1)

    it "emits a response when matched", ->
      Ecl.server.get
        url: "/"
        response:
          foo: "bar"

      @contentWindow.$.get "/"

      Ecl.server.respond()

      ## get the 2nd call which is our response emit
      args = @emit.getCall(1).args[0]
      expect(args).to.deep.eq {
        method: "GET"
        url: "/"
        xhr: @server.requests[0]
        response: @server.responses[0]
      }

    it "#get", ->
      spy = @sandbox.spy()
      Ecl.server.get
        url: "/"
        onRequest: spy
      @contentWindow.$.get "/"
      expect(spy).to.be.called

    it "#post", ->
      spy = @sandbox.spy()
      Ecl.server.post
        url: "/"
        onRequest: spy
      @contentWindow.$.post "/"
      expect(spy).to.be.called

    it "#delete", ->
      spy = @sandbox.spy()
      Ecl.server.delete
        url: "/"
        onRequest: spy
      @contentWindow.$.ajax
        url: "/"
        method: "DELETE"
      expect(spy).to.be.called

    it "#put", ->
      spy = @sandbox.spy()
      Ecl.server.put
        url: "/"
        onRequest: spy
      @contentWindow.$.ajax
        url: "/"
        method: "PUT"
      expect(spy).to.be.called

    it "#patch", ->
      spy = @sandbox.spy()
      Ecl.server.patch
        url: "/"
        onRequest: spy
      @contentWindow.$.ajax
        url: "/"
        method: "PATCH"
      expect(spy).to.be.called

    describe "multiple requests", ->
      beforeEach ->
        Eclectus.Command::emit.restore()
        @emit = @sandbox.spy Eclectus.Command.prototype, "emit"

        Ecl.server.get
          url: "/user"
          response: {foo: "bar"}

        @contentWindow.$.get "/admin"
        @contentWindow.$.get "/user"

        Ecl.server.respond()

      it "logs all requests", ->
        expect(@server.responses).to.have.length 2

      it "logs non requests which had no responses", ->
        expect(@server.responses[0]).to.deep.eq {
          status: 404
          response: ""
          headers: {}
        }

      describe.only "emits events for requests + responses", ->
        it "emits 4 events", ->
          expect(@emit).to.have.callCount 4

        it "adjusts id's not to use the xhr instance", ->
          # console.log @emit