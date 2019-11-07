_ = Cypress._
Promise = Cypress.Promise

describe "src/cy/commands/cookies", ->
  beforeEach ->
    ## call through normally on everything

    cy.stub(Cypress, "automation").callThrough()

  context "test:before:run:async", ->
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

          expect(lastLog.get("error").message).to.eq "some err message"
          expect(lastLog.get("error").name).to.eq "foo"
          expect(lastLog.get("error").stack).to.eq error.stack
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
          expect(err.message).to.eq("cy.getCookies() timed out waiting '50ms' to complete.")
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

          expect(lastLog.get("error").message).to.eq "some err message"
          expect(lastLog.get("error").name).to.eq "foo"
          expect(lastLog.get("error").stack).to.eq error.stack
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
          expect(err.message).to.eq("cy.getCookie() timed out waiting '50ms' to complete.")
          done()

        cy.getCookie("foo", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "cy.getCookie() must be passed a string argument for name."
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.getCookie(123)

      it "throws an error if the cookie name is invalid", (done) ->
        cy.on "fail", (err) =>
          expect(err.message).to.include("cy.getCookie() must be passed an RFC-6265-compliant cookie name.")
          expect(err.message).to.include('You passed:\n\n`m=m`')

          done()

        cy.getCookie("m=m")

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
          { domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345 }
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
          { domain: "brian.dev.local", name: "foo", value: "bar", path: "/foo", secure: true, httpOnly: true, expiry: 987 }
        )

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
          expect(err.message).to.include("cy.setCookie() timed out waiting '50ms' to complete.")
          done()

        cy.setCookie("foo", "bar", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "cy.setCookie() must be passed two string arguments for name and value."
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie(123)

      it "requires a string value", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "cy.setCookie() must be passed two string arguments for name and value."
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.setCookie("foo", 123)

      context "when setting an invalid cookie", ->
        it "throws an error if the cookie name is invalid", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include("cy.setCookie() must be passed an RFC-6265-compliant cookie name.")
            expect(err.message).to.include('You passed:\n\n`m=m`')

            done()

          ## cookie names may not contain =
          ## https://stackoverflow.com/a/6109881/3474615
          cy.setCookie("m=m", "foo")

        it "throws an error if the cookie value is invalid", (done) ->
          cy.on "fail", (err) =>
            expect(err.message).to.include('must be passed an RFC-6265-compliant cookie value.')
            expect(err.message).to.include('You passed:\n\n` bar`')

            done()

          ## cookies may not contain unquoted whitespace
          cy.setCookie("foo", " bar")

        it "throws an error if the backend responds with an error", (done) ->
          cy.on "fail", (err) =>
            expect(skipErrStub).to.be.calledOnce
            expect(errStub).to.be.calledTwice
            expect(err.message).to.contain('unexpected error setting the requested cookie')
            done()

          errStub = cy.stub(Cypress.utils, "throwErrByPath")
          errStub.callThrough()

          ## stub cookie validation so this invalid cookie can make it to the backend
          skipErrStub = errStub
          .withArgs("setCookie.invalid_value")
          .returns()

          ## browser backend should yell since this is invalid
          cy.setCookie("foo", " bar")

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "setCookie"
            @lastLog = log

        Cypress.automation
        .withArgs("set:cookie", {
          domain: "localhost", name: "foo", value: "bar", path: "/", secure: false, httpOnly: false, expiry: 12345
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
          expect(lastLog.get("error").message).to.eq "some err message"
          expect(lastLog.get("error").name).to.eq "foo"
          expect(lastLog.get("error").stack).to.eq error.stack
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
          expect(err.message).to.eq("cy.clearCookie() timed out waiting '50ms' to complete.")
          done()

        cy.clearCookie("foo", {timeout: 50})

      it "requires a string name", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error").message).to.eq "cy.clearCookie() must be passed a string argument for name."
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clearCookie(123)

      it "throws an error if the cookie name is invalid", (done) ->
        cy.on "fail", (err) =>
          expect(err.message).to.include("cy.clearCookie() must be passed an RFC-6265-compliant cookie name.")
          expect(err.message).to.include('You passed:\n\n`m=m`')

          done()

        cy.clearCookie("m=m")

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
          expect(lastLog.get("error").message).to.eq "some err message"
          expect(lastLog.get("error").name).to.eq "foo"
          expect(lastLog.get("error").stack).to.eq err.stack
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.clearCookies()

      it "throws after timing out", (done) ->
        Cypress.automation.resolves(Promise.delay(1000))

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("name")).to.eq("clearCookies")
          expect(lastLog.get("message")).to.eq("")
          expect(err.message).to.eq("cy.clearCookies() timed out waiting '50ms' to complete.")
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
          expect(lastLog.get("error").message).to.eq "some err message"
          expect(lastLog.get("error").name).to.eq "foo"
          expect(lastLog.get("error").stack).to.eq error.stack
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
