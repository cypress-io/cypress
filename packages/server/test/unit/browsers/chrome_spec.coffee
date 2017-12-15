require("../../spec_helper")

os = require("os")

utils = require("#{root}../lib/browsers/utils")
chrome = require("#{root}../lib/browsers/chrome")

describe "lib/browsers/chrome", ->
  context "#_getArgs", ->
    it "disables gpu when linux", ->
      @sandbox.stub(os, "platform").returns("linux")

      args = chrome._getArgs()

      expect(args).to.include("--disable-gpu")

    it "does not disable gpu when not linux", ->
      @sandbox.stub(os, "platform").returns("darwin")

      args = chrome._getArgs()

      expect(args).not.to.include("--disable-gpu")

    it "turns off sandbox when linux", ->
      @sandbox.stub(os, "platform").returns("linux")

      args = chrome._getArgs()

      expect(args).to.include("--no-sandbox")

    it "does not turn off sandbox when not linux", ->
      @sandbox.stub(os, "platform").returns("win32")

      args = chrome._getArgs()

      expect(args).not.to.include("--no-sandbox")

    it "adds user agent when options.userAgent", ->
      args = chrome._getArgs({
        userAgent: "foo"
      })

      expect(args).to.include("--user-agent=foo")

    it "does not add user agent", ->
      args = chrome._getArgs()

      expect(args).not.to.include("--user-agent=foo")
