require("../../spec_helper")

os = require("os")

extension = require("@packages/extension")
background = require("#{root}../lib/background")
utils = require("#{root}../lib/browsers/utils")
chrome = require("#{root}../lib/browsers/chrome")

describe "lib/browsers/chrome", ->
  context "#open", ->
    beforeEach ->
      @args = []

      sinon.stub(chrome, "_getArgs").returns(@args)
      sinon.stub(chrome, "_writeExtension").resolves("/path/to/ext")
      sinon.stub(background, "isRegistered")
      sinon.stub(background, "execute")
      sinon.stub(utils, "launch")
      sinon.stub(utils, "getProfileDir").returns("/profile/dir")
      sinon.stub(utils, "ensureCleanCache").resolves("/profile/dir/CypressCache")

    it "is noop without browser:launch", ->
      background.isRegistered.returns(false)

      chrome.open("chrome", "http://", {}, {})
      .then ->
        expect(background.execute).not.to.be.called

    it "is noop if newArgs are not returned", ->
      background.isRegistered.returns(true)
      background.execute.resolves(null)

      chrome.open("chrome", "http://", {}, {})
      .then =>
        expect(utils.launch).to.be.calledWith("chrome", "http://", @args)

    it "normalizes --load-extension if provided in background file", ->
      background.isRegistered.returns(true)
      background.execute.resolves([
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

    it "normalizes multiple extensions from background", ->
      background.isRegistered.returns(true)
      background.execute.resolves([
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

