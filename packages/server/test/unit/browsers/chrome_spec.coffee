require("../../spec_helper")

os = require("os")

extension = require("@packages/extension")
plugins = require("#{root}../lib/plugins")
utils = require("#{root}../lib/browsers/utils")
chrome = require("#{root}../lib/browsers/chrome")

describe "lib/browsers/chrome", ->
  context "#open", ->
    beforeEach ->
      @args = []

      @sandbox.stub(chrome, "_getArgs").returns(@args)
      @sandbox.stub(chrome, "_writeExtension").resolves("/path/to/ext")
      @sandbox.stub(plugins, "has")
      @sandbox.stub(plugins, "execute")
      @sandbox.stub(utils, "launch")
      @sandbox.stub(utils, "getProfileDir").returns("/profile/dir")
      @sandbox.stub(utils, "ensureCleanCache").resolves("/profile/dir/CypressCache")

    it "is noop without before:browser:launch", ->
      plugins.has.returns(false)

      chrome.open("chrome", "http://", {}, {})
      .then ->
        expect(plugins.execute).not.to.be.called

    it "is noop if newArgs are not returned", ->
      plugins.has.returns(true)
      plugins.execute.resolves(null)

      chrome.open("chrome", "http://", {}, {})
      .then =>
        expect(utils.launch).to.be.calledWith("chrome", "http://", @args)

    it "normalizes --load-extension if provided in plugin", ->
      plugins.has.returns(true)
      plugins.execute.resolves(["--foo=bar", "--load-extension=/foo/bar/baz.js"])

      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")

      chrome.open("chrome", "http://", {}, {})
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

    it "normalizes multiple extensions from plugins", ->
      plugins.has.returns(true)
      plugins.execute.resolves([
        "--foo=bar", "--load-extension=/foo/bar/baz.js,/quux.js"
      ])

      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")

      chrome.open("chrome", "http://", {}, {})
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

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
