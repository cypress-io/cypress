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
