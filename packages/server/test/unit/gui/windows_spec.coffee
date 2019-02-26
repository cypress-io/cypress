require("../../spec_helper")

_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
EE            = require("events").EventEmitter
BrowserWindow = require("electron").BrowserWindow
cyDesktop     = require("@packages/desktop-gui")
user          = require("#{root}../lib/user")
Windows       = require("#{root}../lib/gui/windows")
savedState    = require("#{root}../lib/saved_state")

describe "lib/gui/windows", ->
  beforeEach ->
    Windows.reset()

    @win = new EE()
    @win.loadURL = sinon.stub()
    @win.destroy = sinon.stub()
    @win.getSize = sinon.stub().returns([1, 2])
    @win.getPosition = sinon.stub().returns([3, 4])
    @win.webContents = new EE()
    @win.webContents.openDevTools = sinon.stub()
    @win.isDestroyed = sinon.stub().returns(false)

    sinon.stub(Windows, "_newBrowserWindow").returns(@win)

  afterEach ->
    Windows.reset()

  context ".getBrowserAutomation", ->
    beforeEach ->
      sinon.stub(Windows, "automation")
      sinon.stub(Windows, "getByWebContents")

    it "gets window and passes to electron.automation", ->
      Windows.getByWebContents.withArgs("foo").returns("bar")
      Windows.automation.withArgs("bar").returns("baz")

      expect(Windows.getBrowserAutomation("foo")).to.eq("baz")

  context ".getByWebContents", ->
    beforeEach ->
      sinon.stub(BrowserWindow, "fromWebContents")

    it "calls BrowserWindow.fromWebContents", ->
      BrowserWindow.fromWebContents.withArgs("foo").returns("bar")
      expect(Windows.getByWebContents("foo")).to.eq("bar")

  context ".open", ->
    beforeEach ->
      sinon.stub(Windows, "create").returns(@win)

    it "sets default options", ->
      options = {
        type: "INDEX"
      }

      Windows.open("/path/to/project", options)
      .then (win) ->
        expect(options).to.deep.eq({
          height: 500
          width: 600
          type: "INDEX"
          show: true
          url: cyDesktop.getPathToIndex()
          webPreferences: {
            preload: path.resolve("lib", "ipc", "ipc.js")
          }
        })

        expect(win.loadURL).to.be.calledWith(cyDesktop.getPathToIndex())

    it "resolves with code on GITHUB_LOGIN for will-navigate", ->
      options = {
        type: "GITHUB_LOGIN"
      }

      url = "https://github.com/login"
      url2 = "https://github.com?code=code123"

      sinon.stub(user, "getLoginUrl").resolves(url)

      sinon.stub(@win.webContents, "on").withArgs("will-navigate").yieldsAsync({}, url2)

      Windows.open("/path/to/project", options)
      .then (code) =>
        expect(code).to.eq("code123")
        expect(options.type).eq("GITHUB_LOGIN")
        expect(@win.loadURL).to.be.calledWith(url)

    it "resolves with code on GITHUB_LOGIN for did-get-redirect-request", ->
      options = {
        type: "GITHUB_LOGIN"
      }

      url = "https://github.com/login"
      url2 = "https://github.com?code=code123"

      sinon.stub(user, "getLoginUrl").resolves(url)

      sinon.stub(@win.webContents, "on").withArgs("did-get-redirect-request").yieldsAsync({}, "foo", url2)

      Windows.open("/path/to/project", options)
      .then (code) =>
        expect(code).to.eq("code123")
        expect(options.type).eq("GITHUB_LOGIN")
        expect(@win.loadURL).to.be.calledWith(url)

  context ".create", ->
    it "opens dev tools if saved state is open", ->
      Windows.create("/foo/", {devTools: true})
      expect(@win.webContents.openDevTools).to.be.called

      Windows.create("/foo/", {})
      expect(@win.webContents.openDevTools).not.to.be.calledTwice

    ## TODO: test everything else going on in this method!

  context ".trackState", ->
    beforeEach ->
      savedState()
      .then (@state) =>
        sinon.stub(@state, "set")

        @projectRoot = undefined
        @keys = {
          width: "theWidth"
          height: "someHeight"
          x: "anX"
          y: "aY"
          devTools: "whatsUpWithDevTools"
        }

    it "saves size and position when window resizes, debounced", ->
      ## tried using useFakeTimers here, but it didn't work for some
      ## reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("resize")

      expect(_.debounce).to.be.called

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({
          theWidth: 1
          someHeight: 2
          anX: 3
          aY: 4
        })

    it "returns if window isDestroyed on resize", ->
      @win.isDestroyed.returns(true)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("resize")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).not.to.be.called

    it "saves position when window moves, debounced", ->
      ## tried using useFakeTimers here, but it didn't work for some
      ## reason, so this is the next best thing
      sinon.stub(_, "debounce").returnsArg(0)
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("moved")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({
          anX: 3
          aY: 4
        })

    it "returns if window isDestroyed on moved", ->
      @win.isDestroyed.returns(true)

      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.emit("moved")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).not.to.be.called

    it "saves dev tools state when opened", ->
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.webContents.emit("devtools-opened")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({whatsUpWithDevTools: true})

    it "saves dev tools state when closed", ->
      Windows.trackState(@projectRoot, false, @win, @keys)
      @win.webContents.emit("devtools-closed")

      Promise
      .delay(100)
      .then () =>
        expect(@state.set).to.be.calledWith({whatsUpWithDevTools: false})

  context ".automation", ->
    beforeEach ->
      @cookies = {
        set:    sinon.stub()
        get:    sinon.stub()
        remove: sinon.stub()
      }

      @win = {
        webContents: {
          session: {
            cookies: @cookies
          }
        }
      }

      @automation = Windows.automation(@win)

    describe ".getCookies", ->
      beforeEach ->
        @cookies.get
        .withArgs({domain: "localhost"})
        .yieldsAsync(null, [
          {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
          {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
        ])

      it "returns all cookies", ->
        @automation.getCookies({domain: "localhost"})
        .then (resp) ->
          expect(resp).to.deep.eq([
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expiry: 123}
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expiry: 456}
          ])

    describe ".getCookie", ->
      beforeEach ->
        @cookies.get
        .withArgs({domain: "google.com", name: "session"})
        .yieldsAsync(null, [
          {name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123}
        ])
        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync(null, [])

      it "returns a specific cookie by name", ->
        @automation.getCookie({domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google", secure: true, httpOnly: true, expiry: 123})

      it "returns null when no cookie by name is found", ->
        @automation.getCookie({domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
         expect(resp).to.be.null

    describe ".setCookie", ->
      beforeEach ->
        @cookies.set
        .withArgs({domain: "google.com", name: "session", value: "key", path: "/", url: "http://google.com/"})
        .yieldsAsync(null,
          {name: "session", value: "key", path: "/", domain: "google", secure: false, httpOnly: false}
        )
        .withArgs({domain: "foo", path: "/bar", url: "http://foo/bar"})
        .yieldsAsync(new Error("some error"))

      it "resolves with the cookie props", ->
        @automation.setCookie({domain: "google.com", name: "session", value: "key", path: "/"})
        .then (resp) ->
          expect(resp).to.deep.eq({domain: "google.com", name: "session", value: "key", path: "/", url: "http://google.com/"})

      it "rejects with error", ->
        @automation.setCookie({domain: "foo", path: "/bar", url: "http://foo/bar"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe ".clearCookies", ->
      beforeEach ->
        @cookies.get
        .withArgs({domain: "google.com"})
        .yieldsAsync(null, [
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
        ])
        .withArgs({domain: "cdn.github.com"})
        .yieldsAsync(null, [
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123}
        ])

        @cookies.remove
        .withArgs("https://google.com/", "session")
        .yieldsAsync(null)

        .withArgs("http://google.com/foo", "foo")
        .yieldsAsync(null)

        .withArgs("http://cdn.github.com/assets", "shouldThrow")
        .yieldsAsync(new Error("some error"))

      it "resolves with array of removed cookies", ->
        @automation.clearCookies({domain: "google.com"})
        .then (resp) ->
          expect(resp).to.deep.eq([
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
            {name: "foo",     value: "bar", path: "/foo", domain: "google.com", secure: false, httpOnly: false, expiry: 456}
          ])

      it "rejects with error", ->
        @automation.clearCookies({domain: "cdn.github.com"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe ".clearCookie", ->
      beforeEach ->
        @cookies.get
        .withArgs({domain: "google.com", name: "session"})
        .yieldsAsync(null, [
          {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expiry: 123}
        ])

        .withArgs({domain: "google.com", name: "doesNotExist"})
        .yieldsAsync(null, [])

        .withArgs({domain: "cdn.github.com", name: "shouldThrow"})
        .yieldsAsync(null, [
          {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expiry: 123}
        ])

        @cookies.remove
        .withArgs("https://google.com/", "session")
        .yieldsAsync(null)

        .withArgs("http://cdn.github.com/assets", "shouldThrow")
        .yieldsAsync(new Error("some error"))

      it "resolves single removed cookie", ->
        @automation.clearCookie({domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq(
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expiry: 123}
          )

      it "returns null when no cookie by name is found", ->
        @automation.clearCookie({domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
          expect(resp).to.be.null

      it "rejects with error", ->
        @automation.clearCookie({domain: "cdn.github.com", name: "shouldThrow"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe "isAutomationConnected", ->
      it "returns true", ->
        expect(@automation.isAutomationConnected()).to.be.true
