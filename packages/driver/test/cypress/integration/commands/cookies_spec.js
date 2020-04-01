_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/cookies", ->
  beforeEach ->
    ## call through normally on everything

    cy.stub(Cypress, "automation").rejects(new Error('Cypress.automation was not stubbed'))

  context "test:before:run:async", ->

    it "can test unstubbed, real server", ->
      Cypress.automation.restore()
      cy.setCookie('foo', 'bar')

    it "clears cookies before each test run", ->
      Cypress.automation
      .withArgs("get:cookies", { domain: "localhost" })
      .resolves([ { name: "foo" } ])
      .withArgs("clear:cookies", [ { domain: "localhost", name: "foo" } ])
      .resolves([])

      Cypress.emitThen("test:before:run:async", {})
      .then ->
        expect(Cypress.automation).to.be.calledWith(
          "get:cookies",
          { domain: "localhost" }
        )

        expect(Cypress.automation).to.be.calledWith(
          "clear:cookies",
          [ { domain: "localhost", name: "foo" } ]
        )

    it "does not call clear:cookies when get:cookies returns empty array", ->
      Cypress.automation.withArgs("get:cookies").resolves([])

      Cypress.emitThen("test:before:run:async", {})
      .then ->
        expect(Cypress.automation).not.to.be.calledWith(
          "clear:cookies"
        )

    it "does not attempt to time out", ->
      Cypress.automation
      .withArgs("get:cookies", { domain: "localhost" })
      .resolves([ { name: "foo" } ])
      .withArgs("clear:cookies", [ { domain: "localhost", name: "foo" } ])
      .resolves([])

      timeout = cy.spy(Promise.prototype, "timeout")

      Cypress.emitThen("test:before:run:async", {})
      .then ->
        expect(timeout).not.to.be.called

  context "#getCookies", ->
    it "returns array of cookies", ->
      Cypress.automation.withArgs("get:cookies").resolves([])

      cy.getCookies().should("deep.eq", []).then ->
        expect(Cypress.automation).to.be.calledWith(
          "get:cookies",
          { domain: "localhost" }
        )

    describe "timeout", ->
      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        Cypress.automation.resolves([])

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.getCookies().then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.automation.resolves([])

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.getCookies({timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.getCookies().then ->
          expect(cy.clearTimeout).to.be.calledWith("get:cookies")

          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "getCookies"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on error", (done) ->
        error = new Error("some err message")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)

          expect(lastLog.get("error").message).to.contain "`cy.getCookies()` had an unexpected error reading cookies from #{Cypress.browser.displayName}."
          expect(lastLog.get("error").message).to.contain "some err message"
          expect(lastLog.get("error").message).to.contain error.stack
          done()

        cy.getCookies()

      it "throws after timing out", (done) ->
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("getCookies")
          expect(lastLog.get("message")).to.eq("")
          expect(err.message).to.eq("`cy.getCookies()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/getcookies")
          done()

        cy.getCookies({timeout: 50})

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "getCookies"
            @lastLog = log

        Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([
          {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}
         ])

      it "can turn off logging", ->
        cy.getCookies({log: false}).then ->
          expect(@lastLog).to.be.undefined

      it "ends immediately", ->
        cy.getCookies().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.getCookies().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "displays name 'get cookies'", ->
          cy.getCookies().then ->
            lastLog = @lastLog

            expect(lastLog.get("displayName")).to.eq("get cookies")

      it "#consoleProps", ->
        cy.getCookies().then (cookies) ->
          expect(cookies).to.deep.eq([{name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}])
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.deep.eq cookies
          expect(c["Num Cookies"]).to.eq 1

  context "#getCookie", ->
    it "returns single cookie by name", ->
      Cypress.automation.withArgs("get:cookie").resolves({
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
      })

      cy.getCookie("foo").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
      }).then ->
        expect(Cypress.automation).to.be.calledWith(
          "get:cookie",
          { domain: "localhost", name: "foo" }
        )

    it "returns null when no cookie was found", ->
      Cypress.automation.withArgs("get:cookie").resolves(null)

      cy.getCookie("foo").should("be.null")

    describe "timeout", ->
      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.getCookie("foo").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.getCookie("foo", {timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.getCookie("foo").then ->
          expect(cy.clearTimeout).to.be.calledWith("get:cookie")

          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "getCookie"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on error", (done) ->
        error = new Error("some err message")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)

          expect(lastLog.get("error").message).to.contain "`cy.getCookie()` had an unexpected error reading the requested cookie from #{Cypress.browser.displayName}."
          expect(lastLog.get("error").message).to.contain "some err message"
          expect(lastLog.get("error").message).to.contain error.stack
          done()

        cy.getCookie("foo")

      it "throws after timing out", (done) ->
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("getCookie")
          expect(lastLog.get("message")).to.eq("foo")
          expect(err.message).to.eq("`cy.getCookie()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/getcookie")
          done()

        cy.getCookie("foo", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "`cy.getCookie()` must be passed a string argument for name."
          expect(lastLog.get("error").docsUrl).to.eq("https://on.cypress.io/getcookie")
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.getCookie(123)

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "getCookie"
            @lastLog = log

        Cypress.automation
        .withArgs("get:cookie", { domain: "localhost", name: "foo" })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         })
        .withArgs("get:cookie", { domain: "localhost", name: "bar" })
        .resolves(null)

      it "can turn off logging", ->
        cy.getCookie("foo", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        cy.getCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "has correct message", ->
        cy.getCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq("foo")

      it "snapshots immediately", ->
        cy.getCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "displays name 'get cookie'", ->
        cy.getCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("displayName")).to.eq("get cookie")

      it "#consoleProps", ->
        cy.getCookie("foo").then (cookie) ->
          expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.deep.eq cookie

      it "#consoleProps when no cookie found", ->
        cy.getCookie("bar").then (cookie) ->
          expect(cookie).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq "null"
          expect(c["Note"]).to.eq("No cookie with the name: 'bar' was found.")

  context "#setCookie", ->
    beforeEach ->
      cy.stub(Cypress.utils, "addTwentyYears").returns(12345)

    it "returns set cookie", ->
      Cypress.automation.withArgs("set:cookie").resolves({
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
      })

      cy.setCookie("foo", "bar").should("deep.eq", {
        name: "foo", value: "bar", domain: "localhost", path: "/", secure: false, httpOnly: false, expiry: 12345
      }).then ->
        expect(Cypress.automation).to.be.calledWith(
          "set:cookie",
          { domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345, sameSite: undefined }
        )

    it "can change options", ->
      Cypress.automation.withArgs("set:cookie").resolves({
        name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
      })

      cy.setCookie("foo", "bar", {domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987}).should("deep.eq", {
        name: "foo", value: "bar", domain: "brian.dev.local", path: "/foo", secure: true, httpOnly: true, expiry: 987
      }).then ->
        expect(Cypress.automation).to.be.calledWith(
          "set:cookie",
          { domain: "brian.dev.local", name: "foo", value: "bar", path: "/foo", secure: true, httpOnly: true, expiry: 987, sameSite: undefined }
        )

    it "does not mutate options", ->
      Cypress.automation.resolves()
      options = {}

      cy.setCookie("foo", "bar", {}).then ->
        expect(options).deep.eq({})

    it "can set cookies with sameSite", ->
      Cypress.automation.restore()
      Cypress.utils.addTwentyYears.restore()

      Cypress.sinon.stub(Cypress, 'config').callThrough()
      .withArgs('experimentalGetCookiesSameSite').returns(true)

      cy.setCookie('one', 'bar', { sameSite: 'none', secure: true })
      cy.getCookie('one').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('two', 'bar', { sameSite: 'no_restriction', secure: true })
      cy.getCookie('two').should('include', { sameSite: 'no_restriction' })

      cy.setCookie('three', 'bar', { sameSite: 'Lax' })
      cy.getCookie('three').should('include', { sameSite: 'lax' })

      cy.setCookie('four', 'bar', { sameSite: 'Strict' })
      cy.getCookie('four').should('include', { sameSite: 'strict' })

      cy.setCookie('five', 'bar')

      ## @see https://bugzilla.mozilla.org/show_bug.cgi?id=1624668
      if Cypress.isBrowser('firefox')
        cy.getCookie('five').should('include', { sameSite: 'no_restriction' })
      else
        cy.getCookie('five').should('not.have.property', 'sameSite')

    describe "timeout", ->
      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.setCookie("foo", "bar").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.setCookie("foo", "bar", {timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        Cypress.automation.resolves(null)

        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.setCookie("foo", "bar").then ->
          expect(cy.clearTimeout).to.be.calledWith("set:cookie")

          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "setCookie"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on error", (done) ->
        error = new Error("some err message")
        error.name = "foo"

        Cypress.automation.rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.include "some err message"
          expect(lastLog.get("error").name).to.eq "CypressError"
          expect(lastLog.get("error").stack).to.include error.stack
          done()

        cy.setCookie("foo", "bar")

      it "throws after timing out", (done) ->
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("setCookie")
          expect(lastLog.get("message")).to.eq("foo, bar")
          expect(err.message).to.include("`cy.setCookie()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/setcookie")
          done()

        cy.setCookie("foo", "bar", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "`cy.setCookie()` must be passed two string arguments for `name` and `value`."
          expect(lastLog.get("error").docsUrl).to.eq "https://on.cypress.io/setcookie"
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie(123)

      it "requires a string value", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "`cy.setCookie()` must be passed two string arguments for `name` and `value`."
          expect(lastLog.get("error").docsUrl).to.eq "https://on.cypress.io/setcookie"
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie("foo", 123)

      it "when an invalid samesite prop is supplied", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq """
          If a `sameSite` value is supplied to `cy.setCookie()`, it must be a string from the following list:
            > no_restriction, lax, strict
          You passed:
            > bad
          """
          expect(lastLog.get("error").docsUrl).to.eq "https://on.cypress.io/setcookie"
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie('foo', 'bar', { sameSite: 'bad' })

      it "when samesite=none is supplied and secure is not set", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq """
          Only cookies with the `secure` flag set to `true` can use `sameSite: 'None'`.

          Pass `secure: true` to `cy.setCookie()` to set a cookie with `sameSite: 'None'`.
          """
          expect(lastLog.get("error").docsUrl).to.eq "https://on.cypress.io/setcookie"
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie('foo', 'bar', { sameSite: 'None' })

      context "when setting an invalid cookie", ->
        it "throws an error if the backend responds with an error", (done) ->
          err = new Error("backend could not set cookie")

          Cypress.automation.withArgs("set:cookie").rejects(err)

          cy.on "fail", (err) =>
            expect(Cypress.automation.withArgs("set:cookie")).to.be.calledOnce
            expect(err.message).to.contain('unexpected error setting the requested cookie')
            expect(err.message).to.contain(err.message)
            done()

          ## browser backend should yell since this is invalid
          cy.setCookie("foo", " bar")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "setCookie"
            @lastLog = log

        Cypress.automation
        .withArgs("set:cookie", {
          domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345, sameSite: undefined
        })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         })

      it "can turn off logging", ->
        cy.setCookie("foo", "bar", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        cy.setCookie("foo", "bar").then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.setCookie("foo", "bar").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

          it "displays name 'set cookie'", ->
        cy.setCookie("foo", "bar").then ->
          lastLog = @lastLog

          expect(lastLog.get("displayName")).to.eq("set cookie")

      it "#consoleProps", ->
        cy.setCookie("foo", "bar").then (cookie) ->
          expect(cookie).to.deep.eq({name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false})
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.deep.eq cookie

  context "#clearCookie", ->
    it "returns null", ->
      Cypress.automation.withArgs("clear:cookie").resolves(null)

      cy.clearCookie("foo").should("be.null").then ->
        expect(Cypress.automation).to.be.calledWith(
          "clear:cookie",
          { domain: "localhost", name: "foo" }
        )

    describe "timeout", ->
      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.clearCookie("foo").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.automation.resolves(null)

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.clearCookie("foo", {timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        Cypress.automation.resolves([])

        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.clearCookie("foo").then ->
          expect(cy.clearTimeout).to.be.calledWith("clear:cookie")

          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookie"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on error", (done) ->
        error = new Error("some err message")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.contain "`cy.clearCookie()` had an unexpected error clearing the requested cookie in #{Cypress.browser.displayName}."
          expect(lastLog.get("error").message).to.contain "some err message"
          expect(lastLog.get("error").message).to.contain error.stack
          done()

        cy.clearCookie("foo")

      it "throws after timing out", (done) ->
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("clearCookie")
          expect(lastLog.get("message")).to.eq("foo")
          expect(err.message).to.eq("`cy.clearCookie()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/clearcookie")
          done()

        cy.clearCookie("foo", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "`cy.clearCookie()` must be passed a string argument for name."
          expect(lastLog.get("error").docsUrl).to.eq "https://on.cypress.io/clearcookie"
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clearCookie(123)

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookie"
            @lastLog = log

        Cypress.automation
        .withArgs("clear:cookie", { domain: "localhost", name: "foo" })
        .resolves({
          name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false
         })
         .withArgs("clear:cookie", { domain: "localhost", name: "bar" })
         .resolves(null)

      it "can turn off logging", ->
        cy.clearCookie("foo", {log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        cy.clearCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.clearCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

          it "displays name 'clear cookie'", ->
        cy.clearCookie("foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("displayName")).to.eq("clear cookie")

      it "#consoleProps", ->
        cy.clearCookie("foo").then (cookie) ->
          expect(cookie).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq("null")
          expect(c["Cleared Cookie"]).to.deep.eq {name: "foo", value: "bar", domain: "localhost", path: "/", secure: true, httpOnly: false}

      it "#consoleProps when no matching cookie was found", ->
        cy.clearCookie("bar").then (cookie) ->
          expect(cookie).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq("null")
          expect(c["Cleared Cookie"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookie with the name: 'bar' was found or removed."

  context "#clearCookies", ->
    it "returns null", ->
      Cypress.automation.withArgs("get:cookies").resolves([])

      cy.clearCookies().should("be.null")

    it "does not call 'clear:cookies' when no cookies were returned", ->
      Cypress.automation.withArgs("get:cookies").resolves([])

      cy.clearCookies().then ->
        expect(Cypress.automation).not.to.be.calledWith(
          "clear:cookies"
        )

    it "calls 'clear:cookies' only with clearableCookies", ->
      Cypress.automation
      .withArgs("get:cookies")
      .resolves([
        { name: "foo" },
        { name: "bar" }
      ])
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      })

      cy.stub(Cypress.Cookies, "getClearableCookies")
      .withArgs([{name: "foo"}, {name: "bar"}])
      .returns([{name: "foo"}])

      cy.clearCookies().should("be.null").then ->
        expect(Cypress.automation).to.be.calledWith(
          "clear:cookies",
          [ { name: "foo", domain: "localhost" } ]
        )

    it "calls 'clear:cookies' with all cookies", ->
      Cypress.Cookies.preserveOnce("bar", "baz")

      Cypress.automation
      .withArgs("get:cookies")
      .resolves([
        { name: "foo" },
        { name: "bar" }
        { name: "baz" }
      ])
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      })
      .withArgs("clear:cookies", [
        { name: "foo", domain: "localhost" }
        { name: "bar", domain: "localhost" }
        { name: "baz", domain: "localhost" }
      ])
      .resolves({
        name: "foo"
      })

      cy
        .clearCookies().should("be.null").then ->
          expect(Cypress.automation).to.be.calledWith(
            "clear:cookies",
            [ { name: "foo", domain: "localhost" } ]
          )
        .clearCookies().should("be.null").then ->
          expect(Cypress.automation).to.be.calledWith(
            "clear:cookies", [
              { name: "foo", domain: "localhost" }
              { name: "bar", domain: "localhost" }
              { name: "baz", domain: "localhost" }
            ]
          )

    describe "timeout", ->
      beforeEach ->
        Cypress.automation
        .withArgs("get:cookies")
        .resolves([{}])
        .withArgs("clear:cookies")
        .resolves({})

      it "sets timeout to Cypress.config(responseTimeout)", ->
        Cypress.config("responseTimeout", 2500)

        Cypress.automation.resolves([])

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.clearCookies().then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        Cypress.automation.resolves([])

        timeout = cy.spy(Promise.prototype, "timeout")

        cy.clearCookies({timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        cy.timeout(100)

        cy.spy(cy, "clearTimeout")

        cy.clearCookies().then ->
          expect(cy.clearTimeout).to.be.calledWith("get:cookies")
          expect(cy.clearTimeout).to.be.calledWith("clear:cookies")
          ## restores the timeout afterwards
          expect(cy.timeout()).to.eq(100)

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookies"
            @lastLog = log
            @logs.push(log)

        return null

      it "logs once on 'get:cookies' error", (done) ->
        error = new Error("some err message")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.contain "`cy.clearCookies()` had an unexpected error clearing cookies in #{Cypress.browser.displayName}."
          expect(lastLog.get("error").message).to.contain "some err message"
          expect(lastLog.get("error").message).to.contain error.stack
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clearCookies()

      it "throws after timing out", (done) ->
        Cypress.automation.resolves([{ name: "foo" }])
        Cypress.automation.withArgs("clear:cookies").resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("clearCookies")
          expect(lastLog.get("message")).to.eq("")
          expect(err.message).to.eq("`cy.clearCookies()` timed out waiting `50ms` to complete.")
          expect(err.docsUrl).to.eq("https://on.cypress.io/clearcookies")
          done()

        cy.clearCookies({timeout: 50})

      it "logs once on 'clear:cookies' error", (done) ->
        Cypress.automation.withArgs("get:cookies").resolves([
          {name: "foo"}, {name: "bar"}
        ])

        error = new Error("some err message")
        error.name = "foo"
        error.stack = "stack"

        Cypress.automation.withArgs("clear:cookies").rejects(error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.contain "`cy.clearCookies()` had an unexpected error clearing cookies in #{Cypress.browser.displayName}."
          expect(lastLog.get("error").message).to.contain "some err message"
          expect(lastLog.get("error").message).to.contain error.stack
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clearCookies()

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookies"
            @lastLog = log

        Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([ { name: "foo" } ])
        .withArgs("clear:cookies", [ { name: "foo", domain: "localhost" } ])
        .resolves([
          { name: "foo" }
        ])

      it "can turn off logging", ->
        cy.clearCookies({log: false}).then ->
          expect(@log).to.be.undefined

      it "ends immediately", ->
        cy.clearCookies().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.clearCookies().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

          it "displays name 'get cookies'", ->
        cy.clearCookies().then ->
          lastLog = @lastLog

          expect(lastLog.get("displayName")).to.eq("clear cookies")

      it "#consoleProps", ->
        cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.deep.eq [{name: "foo"}]
          expect(c["Num Cookies"]).to.eq 1

    describe ".log with no cookies returned", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookies"
            @lastLog = log

        Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([])

      it "#consoleProps", ->
        cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookies were found or removed."

    describe ".log when no cookies were cleared", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "clearCookies"
            @lastLog = log

        Cypress.automation
        .withArgs("get:cookies", { domain: "localhost" })
        .resolves([ { name: "foo" } ])
        .withArgs("clear:cookies", [ { name: "foo", domain: "localhost" } ])
        .resolves([])

      it "#consoleProps", ->
        cy.clearCookies().then (cookies) ->
          expect(cookies).to.be.null
          c = @lastLog.invoke("consoleProps")
          expect(c["Yielded"]).to.eq("null")
          expect(c["Cleared Cookies"]).to.be.undefined
          expect(c["Note"]).to.eq "No cookies were found or removed."
