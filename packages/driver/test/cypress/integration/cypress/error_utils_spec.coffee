$errUtils = require("../../../../src/cypress/error_utils.js")
$errorMessages = require("../../../../src/cypress/error_messages")

describe "driver/src/cypress/error_utils", ->
  context ".appendErrMsg", ->
    it "appends error message", ->
      err = new Error("foo")

      expect(err.message).to.eq("foo")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $errUtils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("foo\n\nbar")

      expect(err2.stack).to.eq("Error: foo\n\nbar\n" + stack)

    it "handles error messages matching first stack", ->
      err = new Error("r")

      expect(err.message).to.eq("r")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $errUtils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("r\n\nbar")

      expect(err2.stack).to.eq("Error: r\n\nbar\n" + stack)

    it "handles empty error messages", ->
      err = new Error()

      expect(err.message).to.eq("")
      expect(err.name).to.eq("Error")

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $errUtils.appendErrMsg(err, "bar")
      expect(err2.message).to.eq("\n\nbar")

      expect(err2.stack).to.eq("Error: \n\nbar\n" + stack)
    
    it "handles error messages as objects", ->
      err = new Error("foo")

      obj = {
        message: "bar",
        docsUrl: "baz"
      }

      stack = err.stack.split("\n").slice(1).join("\n")

      err2 = $errUtils.appendErrMsg(err, obj)

      expect(err2.message).to.eq("foo\n\nbar")
      expect(err2.docsUrl).to.eq("baz")
      expect(err2.stack).to.eq("Error: foo\n\nbar\n" + stack)

  context ".makeErrFromObj", ->
    it "copies properties, message, stack", ->
      obj = {
        stack: "stack"
        message: "message"
        name: "Foo"
        code: 123
      }

      err = $errUtils.makeErrFromObj(obj)

      expect(err).to.be.instanceof(window.Error)

      for key, val of obj
        expect(err[key], "key: #{key}").to.eq(obj[key])

  context ".throwErr", ->
    it "throws the error as sent", ->
      try
        $errUtils.throwErr("Something unexpected")
      catch e
        expect(e.message).to.include "Something unexpected"
        expect(e.name).to.eq "CypressError"

  context ".throwErrByPath", ->
    beforeEach ->
      $errorMessages.__test_errors = {
        obj: 
          message: "This is a simple error message"
          docsUrl: "https://on.link.io"
        obj_with_args: 
          message: "This has args like '{{foo}}' and {{bar}}"
          docsUrl: "https://on.link.io"
        obj_with_multi_args: 
          message: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice"
          docsUrl: "https://on.link.io"
        obj_with_markdown: 
          message: "This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_"
          docsUrl: "https://on.link.io"
        str: "This is a simple error message"
        str_with_args: "This has args like '{{foo}}' and {{bar}}"
        str_with_multi_args: "This has args like '{{foo}}' and {{bar}}, and '{{foo}}' is used twice"
        str_with_markdown: "This has markdown like `{{foo}}`, *{{bar}}*, **{{foo}}**, and _{{bar}}_"
        fn: () ->
          """
          This is a simple error message
          """
        fn_with_args: (obj) ->
          """
          This has args like '#{obj.foo}' and #{obj.bar}
          """
        fn_with_multi_args: (obj) ->
          """
          This has args like '#{obj.foo}' and #{obj.bar}, and '#{obj.foo}' is used twice
          """
        fn_with_markdown: (obj) ->
          """
          This has markdown like `#{obj.foo}`, *#{obj.bar}*, **#{obj.foo}**, and _#{obj.bar}_
          """
      }

    describe "when error message path does not exist", ->
      it "has an err.name of InternalError", ->
        try
          $errUtils.throwErrByPath("not.there")
        catch e
          expect(e.name).to.eq "InternalError"

      it "has the right message", ->
        try
          $errUtils.throwErrByPath("not.there")
        catch e
          expect(e.message).to.include "Error message path: 'not.there' does not exist"

    describe "when error message path exists", ->
      context "error is object", ->
        describe "when no args are provided for the error", ->
          it "has an err.name of CypressError", ->
            try
              $errUtils.throwErrByPath("__test_errors.obj")
            catch e
              expect(e.name).to.eq "CypressError"

          it "has the right message and docs url", ->
            try
              $errUtils.throwErrByPath("__test_errors.obj")
            catch e
              expect(e.message).to.include "This is a simple error message"
              expect(e.docsUrl).to.include "https://on.link.io"
        
        describe "when args are provided for the error", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.obj_with_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux"
              expect(e.docsUrl).to.include "https://on.link.io"

        describe "when args are provided for the error and some are used multiple times in message", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.obj_with_multi_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"
              expect(e.docsUrl).to.include "https://on.link.io"
        
        describe "when markdown and args", ->
          it "formats markdown in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.obj_with_markdown", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_"
              expect(e.docsUrl).to.include "https://on.link.io"

      context "error is string", ->
        describe "when no args are provided for the error", ->
          it "has an err.name of CypressError", ->
            try
              $errUtils.throwErrByPath("__test_errors.str")
            catch e
              expect(e.name).to.eq "CypressError"

          it "has the right message and docs url", ->
            try
              $errUtils.throwErrByPath("__test_errors.str")
            catch e
              expect(e.message).to.include "This is a simple error message"
              expect(e.docsUrl).to.be.undefined
        
        describe "when args are provided for the error", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.str_with_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux"

        describe "when args are provided for the error and some are used multiple times in message", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.str_with_multi_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"
        
        describe "when markdown and args", ->
          it "formats markdown in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.str_with_markdown", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_"
      
      context "error is function", ->
        describe "when no args are provided for the error", ->
          it "has an err.name of CypressError", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn")
            catch e
              expect(e.name).to.eq "CypressError"

          it "has the right message and docs url", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn")
            catch e
              expect(e.message).to.include "This is a simple error message"
        
        describe "when args are provided for the error", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_with_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux"

        describe "when args are provided for the error and some are used multiple times in message", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_with_multi_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"
        
        describe "when markdown and args", ->
          it "formats markdown in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_with_markdown", {
                args: {
                  foo: "foo", bar: ["bar", "qux"] 
                }
              })
            catch e
              expect(e.message).to.include "This has markdown like `foo`, *bar,qux*, **foo**, and _bar,qux_"
      
    describe "when onFail is provided as a function", ->
      it "attaches the function to the error", ->
        onFail = ->
        try
          $errUtils.throwErrByPath("__test_errors.obj", { onFail })
        catch e
          expect(e.onFail).to.equal onFail

    describe "when onFail is provided as a command", ->
      it "attaches the handler to the error", ->
        command = { error: cy.spy() }
        try
          $errUtils.throwErrByPath("__test_errors.obj", { onFail: command })
        catch e
          e.onFail("the error")
          expect(command.error).to.be.calledWith("the error")

  context ".normalizeMsgNewLines", ->
    it "removes newlines in excess of 2 newlines", ->
      normalizedMsg = $errUtils.normalizeMsgNewLines("one new line\ntwo new lines\n\nthree new lines\n\n\nend")

      expect(normalizedMsg).to.eq("one new line\ntwo new lines\n\nthree new lines\n\nend")

  context ".errObjByPath", ->
    beforeEach -> 
      @errMsgs = {
        command: {
          obj: 
            message: '{{cmd}} simple error message'
            docsurl: 'https://on.cypress.io'
          str: '{{cmd}} simple error message'
          fn: (obj) ->
            """
            #{obj.cmd} simple error message
            """
        }
      }

    it "returns obj when err is object", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.obj', {
        args: {
          cmd: 'click'
        }
      })
      expect(obj).to.deep.eq({
        message: 'click simple error message'
        docsurl: 'https://on.cypress.io'
      })

    it "returns obj when err is string", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.str', {
        args: {
          cmd: 'click'
        }
      })

      expect(obj).to.deep.eq({
        message: 'click simple error message'
      })

    it "returns obj when err is function", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.fn', {
        args: {
          cmd: 'click'
        }
      })

      expect(obj).to.deep.eq({
        message: 'click simple error message'
      })

  context ".getErrMsgWithObjByPath", ->
    beforeEach -> 
      @errMsgs = {
        command: {
          obj: 
            message: '{{cmd}} simple error message'
            docsurl: ''
          str: '{{cmd}} simple error message'
          fn: (obj) ->
            """
            #{obj.cmd} simple error message
            """
        }
      }

    it "returns the message when err is object", ->
      msg = $errUtils.getErrMsgWithObjByPath(@errMsgs, 'command.obj', {
        args: {
          cmd: 'click'
        }
      })
      expect(msg).to.eq("click simple error message")

    it "returns the message when err is string", ->
      msg = $errUtils.getErrMsgWithObjByPath(@errMsgs, 'command.str', {
        args: {
          cmd: 'click'
        }
      })

      expect(msg).to.eq("click simple error message")

    it "returns the message when err is function", ->
      msg = $errUtils.getErrMsgWithObjByPath(@errMsgs, 'command.str', {
        args: {
          cmd: 'click'
        }
      })

      expect(msg).to.eq("click simple error message")

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

      { frame, path, lineNumber, columnNumber } = $errUtils.getCodeFrame(src, path, line, column)

      expect(frame).to.contain("foo")
      expect(frame).to.contain("bar()")
      expect(frame).to.contain("[0m")
      expect(path).to.eq("foo/bar/baz")
      expect(lineNumber).to.eq(5)
      expect(columnNumber).to.eq(6)

    ## TODO determine if we want more failure cases covered
    it "returns empty string when code frame can't be generated", ->
      path = "foo/bar/baz"
      line = 100 ## There are not 100 lines in src
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

      { frame } = $errUtils.getCodeFrame(src, path, line, column)

      expect(frame).to.eq("")

  context ".escapeErrMarkdown", ->
    it "accepts non-strings", ->
      text = 3
      expect($errUtils.escapeErrMarkdown(text)).to.equal(3)

    it "escapes backticks", ->
      md = "`foo`"
      expect($errUtils.escapeErrMarkdown(md)).to.equal("\\`foo\\`")

  context ".getObjValueByPath", ->
    beforeEach ->
      @obj =
        foo: "foo"
        bar:
          baz:
            qux: "qux"

    it "throws if object not provided as first argument", ->
      fn = ->
        $errUtils.getObjValueByPath("foo")
      
      expect(fn).to.throw "The first parameter to utils.getObjValueByPath() must be an object"

    it "throws if path not provided as second argument", ->
      fn = =>
        $errUtils.getObjValueByPath(@obj)
      
      expect(fn).to.throw "The second parameter to utils.getObjValueByPath() must be a string"

    it "returns value for shallow path", ->
      objVal = $errUtils.getObjValueByPath @obj, "foo"
      expect(objVal).to.equal "foo"

    it "returns value for deeper path", ->
      objVal = $errUtils.getObjValueByPath @obj, "bar.baz.qux"
      expect(objVal).to.equal "qux"

    it "returns undefined for non-existent shallow path", ->
      objVal = $errUtils.getObjValueByPath @obj, "nope"
      expect(objVal).to.be.undefined

    it "returns undefined for non-existent deeper path", ->
      objVal = $errUtils.getObjValueByPath @obj, "bar.baz.nope"
      expect(objVal).to.be.undefined
