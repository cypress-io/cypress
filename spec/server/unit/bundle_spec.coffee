bundle = require("#{root}lib/util/bundle")

describe "lib/util/bundle", ->

  context "#clientSideError", ->

    it "send javascript string with the error", ->
      expect(bundle.clientSideError("an error")).to.equal("""
      (function () {
        Cypress.trigger("script:error", {
          type: "BUNDLE_ERROR",
          error: "an error"
        })
      }())
      """)

    it "replaces new lines with {newline} placeholder", ->
      expect(bundle.clientSideError("with\nnew\nlines")).to.include('error: "with{newline}new{newline}lines"')

    it "removes command line syntax highlighting characters", ->
      expect(bundle.clientSideError("[30mfoo[100mbar[7mbaz")).to.include('error: "foobarbaz"')

  context "#errorMessage", ->
    it "handles error strings", ->
      expect(bundle.errorMessage("error string")).to.include("error string")

    it "handles standard error objects and sends the stack", ->
      err = new Error()
      err.stack = "error object stack"

      expect(bundle.errorMessage(err)).to.equal("error object stack")

    it "sends err.annotated if stack is not present", ->
      err = {
        stack: undefined
        annotated: "annotation"
      }

      expect(bundle.errorMessage(err)).to.equal("annotation")

    it "sends err.message if stack and annotated are not present", ->
      err = {
        stack: undefined
        message: "message"
      }

      expect(bundle.errorMessage(err)).to.equal("message")

    it "removes stack lines", ->
      expect(bundle.errorMessage("foo\n  at what.ever (foo 23:30)\n baz\n    at where.ever (bar 1:5)")).to.equal("foo\n baz")
