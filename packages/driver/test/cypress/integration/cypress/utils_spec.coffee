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

    it "handles error messages as objects", ->
      err = new Error("foo")

      obj = {
        message: "bar",
        docs: "baz"
      }

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $utils.appendErrMsg(err, obj)
      expect(err2.message).to.eq("foo\n\nbar")
      expect(err2.docs).to.eq("baz")

      expect(err2.stack).to.eq("Error: foo\n\nbar\n" + stack)

  context ".escapeErrorMarkdown", ->
    it "accepts non-strings", ->
      text = 3
      expect($utils.escapeErrorMarkdown(text)).to.equal(3)

    it "escapes backticks", ->
      md = "`foo`"
      expect($utils.escapeErrorMarkdown(md)).to.equal("\\`foo\\`")

  context ".getCodeFrame", ->
    it "returns a code frame with syntax highlighting", ->
      path = "foo/bar/baz"
      line = 5
      column = 6
      src = """
        <!DOCTYPE html>
        <html>
        <body>
          <script type="text/javascript">
            foo.bar()
          </script>
        </body>
        </html>
      """

      { frame, path, lineNumber, columnNumber } = $utils.getCodeFrame(src, path, line, column)

      expect(frame).to.contain("foo")
      expect(frame).to.contain("bar()")
      expect(frame).to.contain("[0m")
      expect(path).to.eq("foo/bar/baz")
      expect(lineNumber).to.eq(5)
      expect(columnNumber).to.eq(6)

    ## TODO determine if we want more failure cases covered
    it "fails gracefully", ->
      path = "foo/bar/baz"
      line = 100
      column = 6
      src = """
        <!DOCTYPE html>
        <html>
        <body>
          <script type="text/javascript">
            foo.bar()
          </script>
        </body>
        </html>
      """

      { frame } = $utils.getCodeFrame(src, path, line, column)

      expect(frame).to.eq("")
