require("../../spec_helper")

electron = require("#{root}../lib/browsers/electron")

describe "lib/browsers/electron", ->
  context "._setProxy", ->
    it "sets proxy rules for webContents", ->
      webContents = {
        session: {
          setProxy: @sandbox.stub().yieldsAsync()
        }
      }

      electron._setProxy(webContents, "proxy rules")
      .then ->
        expect(webContents.session.setProxy).to.be.calledWith({
          proxyRules: "proxy rules"
        })

  context ".automation", ->
    beforeEach ->
      @cookies = {
        set:    @sandbox.stub()
        get:    @sandbox.stub()
        remove: @sandbox.stub()
      }

      @win = {
        webContents: {
          session: {
            cookies: @cookies
          }
        }
      }

      @automation = electron.automation(@win)

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
