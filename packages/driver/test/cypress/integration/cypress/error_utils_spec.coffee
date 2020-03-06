$errUtils = require("../../../../src/cypress/error_utils")
$errorMessages = require("../../../../src/cypress/error_messages")

describe "driver/src/cypress/error_utils", ->
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
          expect(e.message).to.include("Error message path 'not.there' does not exist")

    describe "when error message path exists", ->
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
