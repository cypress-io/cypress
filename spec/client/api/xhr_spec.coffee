Ecl = new Eclectus

describe "XHR Command API", ->
  beforeEach ->
    @emit = @sandbox.stub(Eclectus.Command.prototype, "emit").returns(null)

    loadFixture("html/sinon").done (iframe) =>
      Eclectus.patch {$remoteIframe: $(iframe)}
      @remoteWindow = iframe.contentWindow

  it "sets sandbox for each content window", ->
    Ecl.server()
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
      @remoteWindow.$.get "/"
      expect(@server.requests).to.have.length 1

    it "makes requests accessible through Ecl.server", ->
      @remoteWindow.$.get "/"
      expect(Ecl.server.requests).to.have.length 1

    it "invokes any onRequest callback functions on the Ecl server with an xhr instance", ->
      spy = @sandbox.spy()
      Ecl.server.onRequest spy
      @remoteWindow.$.get "/"
      expect(spy).to.be.called
      args = spy.getCall(0).args
      expect(args).to.have.length 1

    it "emits the request", ->
      @remoteWindow.$.get "/"
      args = @emit.getCall(1).args[0]
      expect(args).deep.eq {
        method: "GET"
        url: "/"
        id: @server.requests[0].id
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

      @remoteWindow.$.get "/"

      Ecl.server.respond()

      ## get the 2nd call which is our response emit
      args = @emit.getCall(2).args[0]

      expect(args).to.deep.eq {
        canBeParent: true
        method: "GET response"
        id: @server.responses[0].id
        # parent: @server.requests[0].id
        xhr: @server.requests[0]
        response: @server.responses[0]
      }

    it "#get", ->
      spy = @sandbox.spy()
      Ecl.server.get
        url: "/"
        onRequest: spy
      @remoteWindow.$.get "/"
      expect(spy).to.be.called

    it "#post", ->
      spy = @sandbox.spy()
      Ecl.server.post
        url: "/"
        onRequest: spy
      @remoteWindow.$.post "/"
      expect(spy).to.be.called

    it "#delete", ->
      spy = @sandbox.spy()
      Ecl.server.delete
        url: "/"
        onRequest: spy
      @remoteWindow.$.ajax
        url: "/"
        method: "DELETE"
      expect(spy).to.be.called

    it "#put", ->
      spy = @sandbox.spy()
      Ecl.server.put
        url: "/"
        onRequest: spy
      @remoteWindow.$.ajax
        url: "/"
        method: "PUT"
      expect(spy).to.be.called

    it "#patch", ->
      spy = @sandbox.spy()
      Ecl.server.patch
        url: "/"
        onRequest: spy
      @remoteWindow.$.ajax
        url: "/"
        method: "PATCH"
      expect(spy).to.be.called

    describe "parent / child ids", ->
      beforeEach ->
        Eclectus.Command::emit.restore()
        @emit = @sandbox.spy Eclectus.Command.prototype, "emit"

        Ecl.server.get
          url: "/user"
          response: {foo: "bar"}

        @remoteWindow.$.get "/user"

        Ecl.server.respond()

      it "adjusts id's not to use the xhr instance", ->
        id = @emit.getCall(0).args[0].id
        expect(id).not.to.eq @server.id

      ## responses are no longer grouped with their parent requests
      # it "child responses reference parent requests", ->
      #   parentId = @emit.getCall(0).args[0].id
      #   parent = @emit.getCall(1).args[0].parent
      #   expect(parentId).to.eq parent

    describe "multiple requests", ->
      beforeEach ->
        Eclectus.Command::emit.restore()
        @emit = @sandbox.spy Eclectus.Command.prototype, "emit"

        Ecl.server.get
          url: "/user"
          response: {foo: "bar"}

        @remoteWindow.$.get "/admin"
        @remoteWindow.$.get "/user"

        Ecl.server.respond()

      it "emits 5 events", ->
        expect(@emit).to.have.callCount 5

      it "logs all requests", ->
        expect(@server.responses).to.have.length 2

      it "logs non requests which had no responses", ->
        expect(@server.responses[0]).to.deep.eq {
          id: @server.responses[0].id
          status: 404
          response: ""
          headers: {}
        }

    describe "duplicate requests", ->
      it "matches sinon's logic and calls onRequest for the 2nd matching requesting", ->
        spy = @sandbox.spy()

        Ecl.server.get
          url: "/"

        @remoteWindow.$.get "/"

        Ecl.server.respond()

        Ecl.server.get
          url: "/"
          onRequest: spy

        @remoteWindow.$.get "/"

        expect(spy).to.be.called