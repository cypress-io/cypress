$errUtils = require("../../../../src/cypress/error_utils.js")
$errorMessages = require("../../../../src/cypress/error_messages")
$sourceMapUtils = require("../../../../src/cypress/source_map_utils.js")

describe "driver/src/cypress/error_utils", ->
  context.skip ".modifyErrMsg", ->
    it "modifies errs that are objects", ->
      errObj1 = {
        name: 'FooError',
        message: 'simple foo message'
      }

      errObj2 = {
        name: 'BarError',
        message: 'simple bar message'
      }

      appendMsg1 = $errUtils.modifyErrMsg(errObj1, errObj2, (msg1, msg2) ->
        return "#{msg2} #{msg1}"
      )

      expect(appendMsg1.name).to.eq("FooError")
      expect(appendMsg1.message).to.eq("simple bar message simple foo message")

    it "modifies err that is objects with err that is string", ->
      errObj1 = $errUtils.cypressErr('simple foo message')

      errStr2 = 'simple bar message'

      $errUtils.modifyErrMsg(errObj1, errStr2, (msg1, msg2) ->
        return "#{msg2} #{msg1}"
      )

      expect(errObj1.name).to.eq("CypressError")
      expect(errObj1.message).to.eq("simple bar message simple foo message")
      expect(errObj1.stack).to.include("CypressError: simple bar message simple foo message")

    it "modifies errs that are strings", ->
      errStr1 = 'simple foo message'
      errStr2 = 'simple bar message'

      appendMsg1 = $errUtils.modifyErrMsg(errStr1, errStr2, (msg1, msg2) ->
        return "#{msg2} #{msg1}"
      )

      expect(appendMsg1).to.eq("simple bar message simple foo message")

    it.skip "modifies errs that are functions that return objs", ->

    it.skip "modifies errs that are functions that return strings", ->

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
        fn_returns_obj: () => {
          message: """
            This is a simple error message
            """
          docsUrl: "https://on.link.io"
        }
        fn_returns_obj_with_args: (obj) => {
          message: """
            This has args like '#{obj.foo}' and #{obj.bar}
            """
          docsUrl: "https://on.link.io"
        }
        fn_returns_obj_with_multi_args: (obj) => {
          message: """
            This has args like '#{obj.foo}' and #{obj.bar}, and '#{obj.foo}' is used twice
            """
          docsUrl: "https://on.link.io"
        }
        fn_returns_obj_with_markdown: (obj) => {
          message: """
            This has markdown like `#{obj.foo}`, *#{obj.bar}*, **#{obj.foo}**, and _#{obj.bar}_
            """
          docsUrl: "https://on.link.io"
        }
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

      context "error is function that returns a string", ->
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

      context "error is function that returns an object", ->
        describe "when no args are provided for the error", ->
          it "has an err.name of CypressError", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_returns_obj")
            catch e
              expect(e.name).to.eq "CypressError"

          it "has the right message and docs url", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_returns_obj")
            catch e
              expect(e.message).to.include "This is a simple error message"
              expect(e.docsUrl).to.include "https://on.link.io"

        describe "when args are provided for the error", ->
          it "uses them in the error message", ->
            try
              $errUtils.throwErrByPath("__test_errors.fn_returns_obj_with_args", {
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
              $errUtils.throwErrByPath("__test_errors.fn_returns_obj_with_multi_args", {
                args: {
                  foo: "foo", bar: ["bar", "qux"]
                }
              })
            catch e
              expect(e.message).to.include "This has args like 'foo' and bar,qux, and 'foo' is used twice"
              expect(e.docsUrl).to.include "https://on.link.io"

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
            message: '`{{cmd}}` simple error message'
            docsUrl: 'https://on.cypress.io'
          str: '`{{cmd}}` simple error message'
          fn: (obj) ->
            """
            `#{obj.cmd}` simple error message
            """
        }
      }

    it "returns obj when err is object", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.obj', {
        cmd: 'click'
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message'
        docsUrl: 'https://on.cypress.io'
      })

    it "returns obj when err is string", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.str', {
        cmd: 'click'
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message'
      })

    it "returns obj when err is function", ->
      obj = $errUtils.errObjByPath(@errMsgs, 'command.fn', {
        cmd: 'click'
      })

      expect(obj).to.deep.eq({
        message: '`click` simple error message'
      })

    it "does not mutate the error message when it is an object", ->
      $errUtils.errObjByPath(@errMsgs, 'command.obj', {
        cmd: 'click'
      })
      obj = $errUtils.errObjByPath(@errMsgs, 'command.obj', {
        cmd: 'dblclick'
      })

      expect(obj).to.deep.eq({
        docsUrl: 'https://on.cypress.io'
        message: '`dblclick` simple error message'
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
        cmd: 'click'
      })
      expect(msg).to.eq("click simple error message")

    it "returns the message when err is string", ->
      msg = $errUtils.getErrMsgWithObjByPath(@errMsgs, 'command.str', {
        cmd: 'click'
      })

      expect(msg).to.eq("click simple error message")

    it "returns the message when err is function", ->
      msg = $errUtils.getErrMsgWithObjByPath(@errMsgs, 'command.str', {
        cmd: 'click'
      })

      expect(msg).to.eq("click simple error message")

  context ".addCodeFrameToErr", ->
    beforeEach ->
      @err = {}
      sourceCode = """it('is a failing test', () => {
        cy.get('.not-there')
      })
      """
      cy.stub($sourceMapUtils, "getSourceContents").returns(sourceCode)

    it "adds code frame if provided stack yields one", ->
      cy.stub($sourceMapUtils, "getSourcePosition").returns({
        source: "http://localhost:12345/__cypress/tests?p=cypress/integration/features/source_map_spec.js"
        line: 3
        column: 5
      })
      err = $errUtils.addCodeFrameToErr(@err, """Error
        at Context.<anonymous> (http://localhost:12345/__cypress/tests?p=cypress/integration/features/source_map_spec.js:5:21)
      """)

      expect(err.codeFrames).to.be.an("array")

      { frame, file, line, column } = err.codeFrames[0]

      expect(frame).to.contain("  1 | it('is a failing test', () => {")
      expect(frame).to.contain("  2 |   cy.get('.not-there'")
      expect(frame).to.contain("> 3 | }")
      expect(file).to.equal("http://localhost:12345/__cypress/tests?p=cypress/integration/features/source_map_spec.js")
      expect(line).to.equal(3)
      expect(column).to.eq(5)

    it "does not add code frame if stack does not yield one", ->
      cy.stub($sourceMapUtils, "getSourcePosition").returns(null)

      err = $errUtils.addCodeFrameToErr(@err, """Error
        at Context.<anonymous> (http://localhost:12345/__cypress/tests?p=cypress/integration/features/source_map_spec.js:5:21)
      """)

      expect(err.codeFrames).to.be.undefined

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

  context ".getStackLineDetails", ->
    it "pulls detailed information from stack line", ->
      stack = """Error: foo
      at baz (/foo/bar/cypress/integration/cypress/error_utils_spec.coffee:100:10)
      at bar (/foo/bar/cypress/integration/cypress/error_utils_spec.coffee:102:12)
      at foo (/foo/bar/cypress/integration/cypress/error_utils_spec.coffee:104:14)
      """

      expect($errUtils.getStackLineDetails(stack, 0, "/foo/bar")).to.eql({
        file: "cypress/integration/cypress/error_utils_spec.coffee"
        function: "baz"
        line: 100
        column: 10
      })
      expect($errUtils.getStackLineDetails(stack, 1, "/foo/bar")).to.eql({
        file: "cypress/integration/cypress/error_utils_spec.coffee"
        function: "bar"
        line: 102
        column: 12
      })

  context.only ".getSourceStack", ->
    beforeEach ->
      cy.stub($sourceMapUtils, "getSourcePosition").returns({
        source: 'some_other_file.ts'
        line: 2
        column: 1
      })

      $sourceMapUtils.getSourcePosition.onCall(1).returns({
        source: 'tests?p=cypress/integration/features/source_map_spec.coffee'
        line: 4
        column: 3
      })

      @generatedStack = """Error: spec iframe stack
      at window.__getSpecIframeStack (source_map_spec.js:12:4)
      at Context.<anonymous> (tests?p=cypress/integration/features/source_map_spec.js:6:4)
      """

    it "receives generated stack and returns source stack", ->
      sourceStack = $errUtils.getSourceStack(@generatedStack)

      expect(sourceStack).to.equal("""Error: spec iframe stack
      at window.__getSpecIframeStack (some_other_file.ts:2:1)
      at Context.<anonymous> (tests?p=cypress/integration/features/source_map_spec.coffee:4:3)

      """)

    it "works when first line is the error message", ->
      sourceStack = $errUtils.getSourceStack(@generatedStack)

      expect(sourceStack).to.equal("""Error: spec iframe stack
      at window.__getSpecIframeStack (some_other_file.ts:2:1)
      at Context.<anonymous> (tests?p=cypress/integration/features/source_map_spec.coffee:4:3)

      """)

    it "works when first line is not the error message", ->
      @generatedStack = @generatedStack.split("\n").slice(1).join("\n")
      sourceStack = $errUtils.getSourceStack(@generatedStack)

      expect(sourceStack).to.equal("""at window.__getSpecIframeStack (some_other_file.ts:2:1)
      at Context.<anonymous> (tests?p=cypress/integration/features/source_map_spec.coffee:4:3)

      """)

    it "works when first several lines are the error message", ->
      @generatedStack = "Some\nmore\nlines\n\n#{@generatedStack}"
      sourceStack = $errUtils.getSourceStack(@generatedStack)

      expect(sourceStack).to.equal("""Some
      more
      lines

      Error: spec iframe stack
      at window.__getSpecIframeStack (some_other_file.ts:2:1)
      at Context.<anonymous> (tests?p=cypress/integration/features/source_map_spec.coffee:4:3)

      """)
