require("../../spec_helper")

os = require("os")

extension = require("@packages/extension")
plugins = require("#{root}../lib/plugins")
utils = require("#{root}../lib/browsers/utils")
chrome = require("#{root}../lib/browsers/chrome")
fs = require("#{root}../lib/util/fs")
errors = require("#{root}../lib/errors")

describe "lib/browsers/chrome", ->
  context "#open", ->
    beforeEach ->
      @args = []
      # mock CRI client during testing
      @criClient = {
        ensureMinimumProtocolVersion: sinon.stub().resolves()
        send: sinon.stub().resolves()
        Page: {
          screencastFrame: sinon.stub().returns()
        },
        close: sinon.stub().resolves()
      }
      @automation = {
        use: sinon.stub().returns()
      }
      # mock launched browser child process object
      @launchedBrowser = {
        kill: sinon.stub().returns()
      }

      sinon.spy(errors, "warning")
      sinon.stub(chrome, "_getArgs").returns(@args)
      sinon.stub(chrome, "_writeExtension").resolves("/path/to/ext")
      sinon.stub(chrome, "_connectToChromeRemoteInterface").resolves(@criClient)
      sinon.spy(plugins, "execute")
      sinon.stub(utils, "launch").resolves(@launchedBrowser)
      sinon.stub(utils, "getProfileDir").returns("/profile/dir")
      sinon.stub(utils, "ensureCleanCache").resolves("/profile/dir/CypressCache")
      # port for Chrome remote interface communication
      sinon.stub(utils, "getPort").resolves(50505)

    afterEach ->
      expect(@criClient.ensureMinimumProtocolVersion).to.be.calledOnce

    it "focuses on the page and calls CRI Page.visit", ->
      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        expect(utils.getPort).to.have.been.calledOnce # to get remote interface port
        expect(@criClient.send).to.have.been.calledTwice
        expect(@criClient.send).to.have.been.calledWith("Page.bringToFront")
        expect(@criClient.send).to.have.been.calledWith("Page.navigate")

    it "is noop without before:browser:launch", ->
      chrome.open("chrome", "http://", {}, @automation)
      .then ->
        expect(plugins.execute).not.to.be.called

    it "is noop if newArgs are not returned", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        Promise.resolve(null)

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        # to initialize remote interface client and prepare for true tests
        # we load the browser with blank page first
        expect(utils.launch).to.be.calledWith("chrome", "about:blank", @args)

    it "does not load extension in headless mode", ->
      chrome._writeExtension.restore()

      pathToTheme = extension.getPathToTheme()

      chrome.open({ isHeadless: true, isHeaded: false }, "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--headless"
          "--remote-debugging-port=50505"
          "--remote-debugging-address=127.0.0.1"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

    it "DEPRECATED: normalizes --load-extension if provided in plugin", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve(["--foo=bar", "--load-extension=/foo/bar/baz.js"])

      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")
      
      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(errors.warning).calledOnce

    it "normalizes --load-extension if provided in plugin", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve({args: ["--foo=bar", "--load-extension=/foo/bar/baz.js"]})


      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(errors.warning).not.calledOnce

    it "DEPRECATED: normalizes multiple extensions from plugins", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve ["--foo=bar", "--load-extension=/foo/bar/baz.js,/quux.js"]
      

      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")

      onWarning = sinon.stub()
      chrome.open("chrome", "http://", {onWarning}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(onWarning).calledOnce

    it "normalizes multiple extensions from plugins", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve {args: ["--foo=bar", "--load-extension=/foo/bar/baz.js,/quux.js"]}
      
      pathToTheme = extension.getPathToTheme()

      ## this should get obliterated
      @args.push("--something=else")

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(errors.warning).not.calledOnce

    it "prints depecration message if before:browser:launch argument is mutated as array", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        config.concat([])
        config.push("--foo=bar")
        config.unshift("--load-extension=/foo/bar/baz.js")
        return Promise.resolve()

      pathToTheme = extension.getPathToTheme()

      ## this should be persisted
      @args.push("--something=else")

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--something=else"
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(errors.warning).calledOnce


    it "cleans up an unclean browser profile exit status", ->
      sinon.stub(fs, "readJson").withArgs("/profile/dir/Default/Preferences").resolves({
        profile: {
          exit_type: "Abnormal"
          exited_cleanly: false
        }
      })
      sinon.stub(fs, "writeJson")

      chrome.open("chrome", "http://", {}, @automation)
      .then ->
        expect(fs.writeJson).to.be.calledWith("/profile/dir/Default/Preferences", {
          profile: {
            exit_type: "Normal"
            exited_cleanly: true
          }
        })

    it "calls cri client close on kill", ->
      ## need a reference here since the stub will be monkey-patched
      kill = @launchedBrowser.kill

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        expect(@launchedBrowser.kill).to.be.a("function")
        @launchedBrowser.kill()
      .then =>
        expect(@criClient.close).to.be.calledOnce
        expect(kill).to.be.calledOnce

    it "rejects if CDP version check fails", ->
      @criClient.ensureMinimumProtocolVersion.rejects()

      expect(chrome.open("chrome", "http://", {}, @automation)).to.be.rejectedWith('Cypress requires at least Chrome 64.')

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
