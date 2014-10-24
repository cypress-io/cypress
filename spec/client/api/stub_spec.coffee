Ecl = new Eclectus

describe "Stub API", ->
  beforeEach ->
    @emit = @sandbox.spy(Eclectus.Command.prototype, "emit")

    loadFixture("html/sinon").done (iframe) =>
      Eclectus.patch {$remoteIframe: $(iframe)}
      @remoteWindow = iframe.contentWindow

  it "has a stub method on Ecl", ->
    expect(Ecl).to.have.property "stub"

  it "throws if there is no global sinon", ->
    delete @remoteWindow.sinon
    fn = -> Ecl.stub()
    expect(fn).to.throw(Error)

  it "returns a sinon stub instance", ->
    stub = Ecl.stub()
    expect(stub).to.have.property "create"
    expect(stub).to.have.property "invoke"
    expect(stub).to.have.property "returns"

  it "emits the original stub object", ->
    fn = { foo: -> }

    Ecl.stub(fn, "foo").returns("foo")
    fn.foo()

    emit1 = @emit.getCall(0).args[0]

    expect(emit1).to.have.property "stub", fn.foo
    expect(emit1).to.have.property "stubObj", fn
    expect(emit1).to.have.property "canBeParent", true

  it "emits a child object when the stub is invoked", ->
    fn = { foo: -> }

    Ecl.stub(fn, "foo").returns("foo")
    fn.foo()

    ## this is the first emit for the stub
    emit1 = @emit.getCall(0).args[0]

    ## this is the 2nd emit for the invocation of the stub
    emit2 = @emit.getCall(1).args[0]

    expect(emit2).to.have.property "stub"
    expect(emit2).to.have.property "stubCall"
    expect(emit2).to.have.property "stubObj", fn
    expect(emit2).to.have.property "parent", emit1.id
    expect(emit2).to.have.property "method", "call #1"
    expect(emit2).to.have.property "message", "returned foo"
    expect(emit2).not.to.have.property "error"

  it "captures the error when the stub throws an exception", ->
    fn = { foo: -> }

    Ecl.stub(fn, "foo").throws()

    try
      fn.foo()

    emit2 = @emit.getCall(1).args[0]
    expect(emit2).to.have.property "error"

  it "returns the correct return value", ->
    fn = { foo: -> }
    Ecl.stub(fn, "foo").returns(true)

    expect(fn.foo()).to.eq true

  context "message return value", ->
    beforeEach ->
      @setup = (arg, ret) ->
        stub = Ecl.stub().returns(arg)
        stub()
        emit2 = @emit.getCall(1).args[0]
        expect(emit2).to.have.property "message", "returned #{ret}"

    it "stringifies when an object", ->
      @setup {foo: "bar"}, '{"foo":"bar"}'

    it "stringifies when an array", ->
      @setup [1,2,3], '[1,2,3]'

