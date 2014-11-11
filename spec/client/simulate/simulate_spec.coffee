describe "Simulate DOM Events", ->

  it "instantiates Simulate with el, event, and options", ->
    spy = sinon.spy(window, "Simulate")

    b = $("body").simulate("click", {foo: "foo"})
    expect(spy).to.be.calledWith b[0], "click", {foo: "foo"}