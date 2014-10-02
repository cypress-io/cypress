Ecl = new Eclectus

describe "Spy API", ->
  beforeEach ->
    @emit = @sandbox.stub(Eclectus.Command.prototype, "emit")

    loadFixture("html/sinon").progress (iframe) =>
      Eclectus.sandbox iframe.contentWindow
      Eclectus.patch {contentWindow: iframe.contentWindow}
      @contentWindow = iframe.contentWindow

  it "has a spy method on Ecl", ->
    expect(Ecl).to.have.property "spy"

  it "throws if there is no sandbox", ->
    delete Eclectus::sandbox
    fn = -> Ecl.spy()
    expect(fn).to.throw(Error)

  it "emits the original spy object", ->
    fn = { foo: -> }

    Ecl.spy(fn, "foo")
    expect(@emit.getCall(0).args[0]).to.have.property "spy", fn.foo

  it "emits a child object when the spy is invoked", ->
    fn = { foo: -> }

    Ecl.spy(fn, "foo")
    fn.foo()

    ## this is the first emit for the spy
    emit1 = @emit.getCall(0).args[0]

    ## this is the 2nd emit for the invocation of the spy
    emit2 = @emit.getCall(1).args[0]

    expect(emit2).to.have.property "spy"
    expect(emit2).to.have.property "spyCall"
    expect(emit2).to.have.property "parent", emit1.id
    expect(emit2).to.have.property "method", "call #1"
    expect(emit2).not.to.have.property "error"

  it "can create a spy from nothing", ->
    spy = Ecl.spy()

    spy("foo")

    expect(@emit).to.be.calledTwice

  it "captures the error when the spy throws an exception", ->
    fn = { foo: -> throw new Error() }

    Ecl.spy(fn, "foo")

    try
      fn.foo()

    emit2 = @emit.getCall(1).args[0]
    expect(emit2).to.have.property "error"
