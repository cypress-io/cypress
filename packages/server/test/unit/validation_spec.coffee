require("../spec_helper")
snapshot = require("snap-shot-it")
v = require("#{root}lib/util/validation")

describe "lib/util/validation", ->
  context "#isOneOf", ->
    it "validates a string", ->
      validate = v.isOneOf("foo", "bar")
      expect(validate).to.be.a("function")
      expect(validate("test", "foo")).to.be.true
      expect(validate("test", "bar")).to.be.true

      # different value
      msg = validate("test", "nope")
      expect(msg).to.not.be.true
      snapshot("not one of the strings error message", msg)

      msg = validate("test", 42)
      expect(msg).to.not.be.true
      snapshot("number instead of string", msg)

      msg = validate("test", null)
      expect(msg).to.not.be.true
      snapshot("null instead of string", msg)

    it "validates a number", ->
      validate = v.isOneOf(1, 2, 3)
      expect(validate).to.be.a("function")
      expect(validate("test", 1)).to.be.true
      expect(validate("test", 3)).to.be.true

      # different value
      msg = validate("test", 4)
      expect(msg).to.not.be.true
      snapshot("not one of the numbers error message", msg)

      msg = validate("test", "foo")
      expect(msg).to.not.be.true
      snapshot("string instead of a number", msg)

      msg = validate("test", null)
      expect(msg).to.not.be.true
      snapshot("null instead of a number", msg)
