require("../../spec_helper")

os = require("os")

extension = require("@packages/extension")
plugins = require("#{root}../lib/plugins")
utils = require("#{root}../lib/browsers/utils")
chrome = require("#{root}../lib/browsers/chrome")
fs = require("#{root}../lib/util/fs")

describe "lib/browsers/chrome", ->
  context "#open", ->
    beforeEach ->
      @args = []

      sinon.stub(chrome, "_getArgs").returns(@args)
      sinon.stub(utils, "writeExtension").resolves("/path/to/ext")
      sinon.stub(plugins, "has")
      sinon.stub(plugins, "execute")
      sinon.stub(utils, "launch")
      sinon.stub(utils, "ensureProfile").resolves("/profile/dir")

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
      plugins.execute.resolves([
        "--foo=bar", "--load-extension=/foo/bar/baz.js"
      ])

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

    it "cleans up an unclean browser profile exit status", ->
      sinon.stub(fs, "readJson").withArgs("/profile/dir/Default/Preferences").resolves({
        profile: {
          exit_type: "Abnormal"
          exited_cleanly: false
        }
      })
      sinon.stub(fs, "writeJson")

      chrome.open("chrome", "http://", {}, {})
      .then ->
        expect(fs.writeJson).to.be.calledWith("/profile/dir/Default/Preferences", {
          profile: {
            exit_type: "Normal"
            exited_cleanly: true
          }
        })

  context "#_getArgs", ->
    it "disables gpu when linux", ->
      sinon.stub(os, "platform").returns("linux")

      args = chrome._getArgs()

      expect(args).to.include("--disable-gpu")

    it "does not disable gpu when not linux", ->
      sinon.stub(os, "platform").returns("darwin")

      args = chrome._getArgs()

      expect(args).not.to.include("--disable-gpu")

    it "turns off sandbox when linux", ->
      sinon.stub(os, "platform").returns("linux")

      args = chrome._getArgs()

      expect(args).to.include("--no-sandbox")

    it "does not turn off sandbox when not linux", ->
      sinon.stub(os, "platform").returns("win32")

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

    it "disables RootLayerScrolling in versions 66 or 67", ->
      arg = "--disable-blink-features=RootLayerScrolling"

      disabledRootLayerScrolling = (version, bool) ->
        args = chrome._getArgs({
          browser: {
            majorVersion: version
          }
        })

        if bool
          expect(args).to.include(arg)
        else
          expect(args).not.to.include(arg)

      disabledRootLayerScrolling("65", false)
      disabledRootLayerScrolling("66", true)
      disabledRootLayerScrolling("67", true)
      disabledRootLayerScrolling("68", false)

    ## https://github.com/cypress-io/cypress/issues/1872
    it "adds <-loopback> proxy bypass rule in version 72+", ->
      arg = "--proxy-bypass-list=<-loopback>"

      chromeVersionHasLoopback = (version, bool) ->
        args = chrome._getArgs({
          browser: {
            majorVersion: version
          }
        })

        if bool
          expect(args).to.include(arg)
        else
          expect(args).not.to.include(arg)

      chromeVersionHasLoopback("71", false)
      chromeVersionHasLoopback("72", true)
      chromeVersionHasLoopback("73", true)

