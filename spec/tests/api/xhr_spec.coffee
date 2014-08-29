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

    describe "#stub", ->
      it "inserts a response", ->
        Ecl.server.stub
          method: "GET"
          url: "/"
        expect(@server.server.responses).to.have.length(1)