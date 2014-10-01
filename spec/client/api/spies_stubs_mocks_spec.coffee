Ecl = new Eclectus

describe "Spies Stubs Mocks API", ->
  beforeEach ->
    @emit = @sandbox.stub(Eclectus.Command.prototype, "emit")

    loadFixture("html/sinon").progress (iframe) =>
      Eclectus.sandbox iframe.contentWindow
      Eclectus.patch {contentWindow: iframe.contentWindow}
      @contentWindow = iframe.contentWindow

  context "Spies", ->
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

    it "can create a spy from nothing", ->
      spy = Ecl.spy()

      spy("foo")

      expect(@emit).to.be.calledTwice