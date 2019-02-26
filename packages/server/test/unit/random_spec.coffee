require("../spec_helper")

randomstring = require("randomstring")
random = require("#{root}lib/util/random")

context ".id", ->
  it "returns random.generate string", ->
    sinon.spy(randomstring, "generate")

    id = random.id()
    expect(id.length).to.eq(5)

    expect(randomstring.generate).to.be.calledWith({
      length: 5
      capitalization: "lowercase"
    })
