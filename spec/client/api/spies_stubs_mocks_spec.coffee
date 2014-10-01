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
      fn =
        foo: ->

      Ecl.spy(fn, "foo")
      expect(@emit.getCall(0).args[0]).to.have.property "spy", fn.foo