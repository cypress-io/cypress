describe "Simulate DOM Events", ->
  beforeEach ->
    loadFixture("html/simulate")

  it "instantiates Simulate with el, event, and options", ->
    spy = sinon.spy(Simulate, "Native")

    b = $("body").cySimulate("click", {foo: "foo"})
    expect(spy).to.be.calledWith b[0], "click"

  it "first calls mousedown and mouseup if event is clicked"

  it "dynamically figures out clientX and clientY"

