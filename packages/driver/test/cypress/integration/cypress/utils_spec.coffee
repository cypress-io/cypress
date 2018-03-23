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

  context ".runSerially", ->
    it "runs the functions serially", ->
      str = ""

      fns = [
        ->
          str += "a"
          Promise.resolve().delay(40)
        ->
          str += "b"
          Promise.resolve().delay(80)
        ->
          str += "c"
          Promise.resolve().delay(20)
      ]

      $utils.runSerially(fns).then ->
        expect(str).to.equal("abc")

    it "collects the resolved values as an array", ->
      fns = [
        -> Promise.resolve().delay(40).return("a")
        -> Promise.resolve().delay(80).return("b")
        -> Promise.resolve().delay(20).return("c")
      ]

      $utils.runSerially(fns).then (result) ->
        expect(result).to.eql(["a", "b", "c"])

    it "rejects if any function throws", ->
      fns = [
        -> throw new Error("failed")
        -> Promise.resolve().delay(80).return("b")
        -> Promise.resolve().delay(20).return("c")
      ]

      $utils.runSerially(fns).catch (err) ->
        expect(err.message).to.include("failed")

    it "rejects if any promise rejects", ->
      fns = [
        -> Promise.resolve().delay(40).return("a")
        -> Promise.reject(new Error("failed 2"))
        -> Promise.resolve().delay(20).return("c")
      ]

      $utils.runSerially(fns).catch (err) ->
        expect(err.message).to.include("failed 2")
