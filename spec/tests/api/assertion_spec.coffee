describe "Assertion Command API", ->
  beforeEach ->
    @sandbox.stub(Eclectus.Assertion.prototype, "emit").returns(null)
    @assertion = new Eclectus.Assertion

  context "#parseValueActualAndExpected", ->
    describe "parses and transforms value, actual, and expected", ->
      it "only has subject when value is a jquery object", ->
        obj = @assertion.parseValueActualAndExpected $("body"), $("body"), "some content"
        expect(obj).to.have.keys("subject")
        expect(obj).not.to.have.keys("value", "actual", "expected")

      it "only has a subject when value matches actual without an expected", ->
        obj = @assertion.parseValueActualAndExpected $("body"), $("body")
        expect(obj).to.have.keys("subject")
        expect(obj).not.to.have.keys("value", "actual", "expected")

      it "only has a subject when value is a jquery object and there is no actual or expected", ->
        obj = @assertion.parseValueActualAndExpected $("body")
        expect(obj).to.have.keys("subject")
        expect(obj).not.to.have.keys("value", "actual", "expected")

      it "has a subject, actual, and expected when value is a jquery object and actual and expected are present", ->
        obj = @assertion.parseValueActualAndExpected $("body"), "buy some cheese", "buy some cheese"
        expect(obj).to.have.keys("subject", "actual", "expected")
        expect(obj).not.to.have.keys("value")

      it "only has actual, expected when value, actual, and expected are present and value is not a jquery object", ->
        obj = @assertion.parseValueActualAndExpected 2, 2, 3
        expect(obj).to.have.keys("actual", "expected")
        expect(obj).not.to.have.keys("subject", "value")
