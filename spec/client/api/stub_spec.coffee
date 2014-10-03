Ecl = new Eclectus

describe "Stub API", ->
  beforeEach ->
    @emit = @sandbox.stub(Eclectus.Command.prototype, "emit")

    loadFixture("html/sinon").done (iframe) =>
      Eclectus.sandbox iframe.contentWindow
      Eclectus.patch {contentWindow: iframe.contentWindow}
      @contentWindow = iframe.contentWindow

  it "has a stub method on Ecl", ->
    expect(Ecl).to.have.property "stub"

  it "throws if there is no sandbox", ->
    delete Eclectus::sandbox
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

    expect(@emit.getCall(0).args[0]).to.have.property "stub", fn.foo

  it "emits a child object when the spy is invoked", ->
    fn = { foo: -> }

    Ecl.stub(fn, "foo").returns("foo")
    fn.foo()

    ## this is the first emit for the spy
    emit1 = @emit.getCall(0).args[0]

    ## this is the 2nd emit for the invocation of the spy
    emit2 = @emit.getCall(1).args[0]

    expect(emit2).to.have.property "stub"
    expect(emit2).to.have.property "stubCall"
    expect(emit2).to.have.property "parent", emit1.id
    expect(emit2).to.have.property "method", "call #1"
    expect(emit2).to.have.property "message", "returned foo"
    expect(emit2).not.to.have.property "error"