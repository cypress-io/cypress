LimitedMap = require("../../../../src/util/limited_map")

_ = Cypress._
$utils = Cypress.utils
Promise = Cypress.Promise

describe "driver/src/cypress/utils", ->
  context ".cloneErr", ->
    it "copies properies, message, stack", ->
      obj = {
        stack: "stack"
        message: "message"
        name: "Foo"
        code: 123
      }

      err = $utils.cloneErr(obj)

      expect(err).to.be.instanceof(top.Error)

      for key, val of obj
        expect(err[key], "key: #{key}").to.eq(obj[key])

  context ".appendErrMsg", ->
    it "appends error message", ->
      err = new Error("foo")

      expect(err.message).to.eq("foo")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $utils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("foo\n\nbar")

      expect(err2.stack).to.eq("Error: foo\n\nbar\n" + stack)

    it "handles error messages matching first stack", ->
      err = new Error("r")

      expect(err.message).to.eq("r")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $utils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("r\n\nbar")

      expect(err2.stack).to.eq("Error: r\n\nbar\n" + stack)

    it "handles empty error messages", ->
      err = new Error()

      expect(err.message).to.eq("")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $utils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("\n\nbar")

      expect(err2.stack).to.eq("Error: \n\nbar\n" + stack)

  context ".memoize", ->
    it "runs the function the first time", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result = memoizedFn("input")
      expect(fn).to.be.calledWith("input")
      expect(result).to.equal("output")

    it "runs the function for unique first arguments", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result1 = memoizedFn("input-1")
      result2 = memoizedFn("input-2")
      expect(fn).to.be.calledWith("input-1")
      expect(fn).to.be.calledWith("input-2")
      expect(fn).to.be.calledTwice
      expect(result1).to.equal("output")
      expect(result2).to.equal("output")

    it "returns cached return value if first argument is the same", ->
      fn = cy.stub().returns("output")
      memoizedFn = $utils.memoize(fn)
      result1 = memoizedFn("input")
      result2 = memoizedFn("input")
      expect(fn).to.be.calledWith("input")
      expect(fn).to.be.calledOnce
      expect(result1).to.equal("output")
      expect(result2).to.equal("output")

    it "accepts a cache instance to use as the second argument", ->
      fn = cy.stub().returns("output")
      ## LimitedMap(2) only holds on to 2 items at a time and clears older ones
      memoizedFn = $utils.memoize(fn, new LimitedMap(2))
      memoizedFn("input-1")
      memoizedFn("input-2")
      expect(fn).to.be.calledTwice
      memoizedFn("input-3")
      expect(fn).to.be.calledThrice
      memoizedFn("input-1")
      ## cache for input-1 is cleared, so it calls the function again
      expect(fn.callCount).to.be.equal(4)
