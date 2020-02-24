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

      sinon.stub(chrome, "_writeExtension").resolves("/path/to/ext")
      sinon.stub(chrome, "_connectToChromeRemoteInterface").resolves(@criClient)
      sinon.stub(plugins, "execute").callThrough()
      sinon.stub(utils, "launch").resolves(@launchedBrowser)
      sinon.stub(utils, "getProfileDir").returns("/profile/dir")
      sinon.stub(utils, "ensureCleanCache").resolves("/profile/dir/CypressCache")

      @readJson = sinon.stub(fs, 'readJson')
      @readJson.withArgs('/profile/dir/Default/Preferences').rejects({ code: 'ENOENT' })
      @readJson.withArgs('/profile/dir/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      @readJson.withArgs('/profile/dir/Local State').rejects({ code: 'ENOENT' })

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
      args = []

      sinon.stub(chrome, "_getArgs").returns(args)
      sinon.stub(plugins, 'has').returns(true)

      plugins.execute.resolves(null)

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        # to initialize remote interface client and prepare for true tests
        # we load the browser with blank page first
        expect(utils.launch).to.be.calledWith("chrome", "about:blank", args)

    it "does not load extension in headless mode", ->
      chrome._writeExtension.restore()

      pathToTheme = extension.getPathToTheme()

      chrome.open({ isHeadless: true, isHeaded: false }, "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.include.members([
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

      onWarning = sinon.stub()

      chrome.open("chrome", "http://", { onWarning }, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.deep.eq([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(onWarning).calledOnce

    it "normalizes --load-extension if provided in plugin", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve({
          args: ["--foo=bar", "--load-extension=/foo/bar/baz.js"]
        })

      pathToTheme = extension.getPathToTheme()

      chrome.open("chrome", "http://", {}, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.include.members([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

    it "normalizes multiple extensions from plugins", ->
      plugins.register 'before:browser:launch', (browser, config) ->
        return Promise.resolve {args: ["--foo=bar", "--load-extension=/foo/bar/baz.js,/quux.js"]}

      pathToTheme = extension.getPathToTheme()

      onWarning = sinon.stub()

      chrome.open("chrome", "http://", { onWarning }, @automation)
      .then =>
        args = utils.launch.firstCall.args[2]

        expect(args).to.include.members([
          "--foo=bar"
          "--load-extension=/foo/bar/baz.js,/quux.js,/path/to/ext,#{pathToTheme}"
          "--user-data-dir=/profile/dir"
          "--disk-cache-dir=/profile/dir/CypressCache"
        ])

        expect(onWarning).not.calledOnce

    it "cleans up an unclean browser profile exit status", ->
      @readJson.withArgs("/profile/dir/Default/Preferences").resolves({
        profile: {
          exit_type: "Abnormal"
          exited_cleanly: false
        }
      })
      sinon.stub(fs, "outputJson").resolves()

      chrome.open("chrome", "http://", {}, @automation)
      .then ->
        expect(fs.outputJson).to.be.calledWith("/profile/dir/Default/Preferences", {
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

      args = chrome._getArgs({}, {})

      expect(args).to.include("--disable-gpu")

    it "does not disable gpu when not linux", ->
      sinon.stub(os, "platform").returns("darwin")

      args = chrome._getArgs({}, {})

      expect(args).not.to.include("--disable-gpu")

    it "turns off sandbox when linux", ->
      sinon.stub(os, "platform").returns("linux")

      args = chrome._getArgs({}, {})

      expect(args).to.include("--no-sandbox")

    it "does not turn off sandbox when not linux", ->
      sinon.stub(os, "platform").returns("win32")

      args = chrome._getArgs({}, {})

      expect(args).not.to.include("--no-sandbox")

    it "adds user agent when options.userAgent", ->
      args = chrome._getArgs({}, {
        userAgent: "foo"
      })

      expect(args).to.include("--user-agent=foo")

    it "does not add user agent", ->
      args = chrome._getArgs({}, {})

      expect(args).not.to.include("--user-agent=foo")

    it "disables RootLayerScrolling in versions 66 or 67", ->
      arg = "--disable-blink-features=RootLayerScrolling"

      disabledRootLayerScrolling = (version, bool) ->
        args = chrome._getArgs({
          majorVersion: version
        }, {})

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
          majorVersion: version
        }, {})

        if bool
          expect(args).to.include(arg)
        else
          expect(args).not.to.include(arg)

      chromeVersionHasLoopback("71", false)
      chromeVersionHasLoopback("72", true)
      chromeVersionHasLoopback("73", true)

  context "#_getChromePreferences", ->
    it "returns map of empty if the files do not exist", ->
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Default/Secure Preferences').rejects({ code: 'ENOENT' })
      .withArgs('/foo/Local State').rejects({ code: 'ENOENT' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: {},
        defaultSecure: {},
        localState: {}
      })

    it "returns map of json objects if the files do exist", ->
      sinon.stub(fs, 'readJson')
      .withArgs('/foo/Default/Preferences').resolves({ foo: 'bar' })
      .withArgs('/foo/Default/Secure Preferences').resolves({ bar: 'baz' })
      .withArgs('/foo/Local State').resolves({ baz: 'quux' })

      expect(chrome._getChromePreferences('/foo')).to.eventually.deep.eq({
        default: { foo: 'bar' },
        defaultSecure: { bar: 'baz' },
        localState: { baz: 'quux' }
      })

  context "#_mergeChromePreferences", ->
    it "merges as expected", ->
      originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar'
          deleteThis: 'nephew'
        },
        localState: {}
      }

      newPrefs = {
        default: {
          something: {
            nested: 'here'
          },
        },
        defaultSecure: {
          deleteThis: null
        },
        someGarbage: true
      }

      expected = {
        default: {
          something: {
            nested: 'here'
          }
        },
        defaultSecure: {
          foo: 'bar'
        },
        localState: {}
      }

      expect(chrome._mergeChromePreferences(originalPrefs, newPrefs)).to.deep.eq(expected)

  context "#_writeChromePreferences", ->
    it "writes json as expected", ->
      outputJson = sinon.stub(fs, 'outputJson')
      defaultPrefs = outputJson.withArgs('/foo/Default/Preferences').resolves()
      securePrefs = outputJson.withArgs('/foo/Default/Secure Preferences').resolves()
      statePrefs = outputJson.withArgs('/foo/Local State').resolves()

      originalPrefs = {
        default: {},
        defaultSecure: {
          foo: 'bar'
          deleteThis: 'nephew'
        },
        localState: {}
      }

      newPrefs = chrome._mergeChromePreferences(originalPrefs, {
        default: {
          something: {
            nested: 'here'
          },
        },
        defaultSecure: {
          deleteThis: null
        },
        someGarbage: true
      })

      expect(chrome._writeChromePreferences('/foo', originalPrefs, newPrefs)).to.eventually.equal()
      .then ->
        expect(defaultPrefs).to.be.calledWith('/foo/Default/Preferences', {
          something: {
            nested: 'here'
          },
        })

        expect(securePrefs).to.be.calledWith('/foo/Default/Secure Preferences', {
          foo: 'bar'
        })

        ## no changes were made
        expect(statePrefs).to.not.be.called
