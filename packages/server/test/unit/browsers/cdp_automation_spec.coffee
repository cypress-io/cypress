require("../../spec_helper")
{ CdpAutomation } = require("#{root}../lib/browsers/cdp_automation")

context "lib/browsers/cdp_automation", ->
  context ".CdpAutomation", ->
    beforeEach ->
      @sendDebuggerCommand = sinon.stub()

      @automation = CdpAutomation(@sendDebuggerCommand)

      @sendDebuggerCommand
      .throws()
      .withArgs('Browser.getVersion')
      .resolves()

      @onRequest = @automation.onRequest

    describe "get:cookies", ->
      beforeEach ->
        @sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expires: 123}
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expires: 456}
          ]
        })

      it "returns all cookies", ->
        @onRequest('get:cookies', { domain: "localhost" })
        .then (resp) ->
          expect(resp).to.deep.eq([
            {name: "foo", value: "f", path: "/", domain: "localhost", secure: true, httpOnly: true, expirationDate: 123}
            {name: "bar", value: "b", path: "/", domain: "localhost", secure: false, httpOnly: false, expirationDate: 456}
          ])

    describe "get:cookie", ->
      beforeEach ->
        @sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/login", domain: "google.com", secure: true, httpOnly: true, expires: 123}
          ]
        })

      it "returns a specific cookie by name", ->
        @onRequest('get:cookie', {domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq({name: "session", value: "key", path: "/login", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123})

      it "returns null when no cookie by name is found", ->
        @onRequest('get:cookie', {domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
         expect(resp).to.be.null

    describe "set:cookie", ->
      beforeEach ->
        @sendDebuggerCommand.withArgs('Network.setCookie', {domain: ".google.com", name: "session", value: "key", path: "/", expires: undefined})
        .resolves({ success: true })
        .withArgs('Network.setCookie', {domain: "foo", path: "/bar", name: "", value: "", expires: undefined})
        .rejects(new Error("some error"))
        .withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/", domain: ".google.com", secure: false, httpOnly: false}
          ]
        })

      it "resolves with the cookie props", ->
        @onRequest('set:cookie', {domain: "google.com", name: "session", value: "key", path: "/"})
        .then (resp) ->
          expect(resp).to.deep.eq({domain: ".google.com", expirationDate: undefined, httpOnly: false, name: "session", value: "key", path: "/", secure: false})

      it "rejects with error", ->
        @onRequest('set:cookie', {domain: "foo", path: "/bar"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe "clear:cookie", ->
      beforeEach ->
        @sendDebuggerCommand.withArgs('Network.getAllCookies')
        .resolves({
          cookies: [
            {name: "session", value: "key", path: "/",    domain: "google.com", secure: true, httpOnly: true, expires: 123}
            {name: "shouldThrow", value: "key", path: "/assets", domain: "cdn.github.com", secure: false, httpOnly: true, expires: 123}
          ]
        })

        @sendDebuggerCommand.withArgs('Network.deleteCookies', { domain: "cdn.github.com", name: "shouldThrow" })
        .rejects(new Error("some error"))
        .withArgs('Network.deleteCookies')
        .resolves()

      it "resolves single removed cookie", ->
        @onRequest('clear:cookie', {domain: "google.com", name: "session"})
        .then (resp) ->
          expect(resp).to.deep.eq(
            {name: "session", value: "key", path: "/", domain: "google.com", secure: true, httpOnly: true, expirationDate: 123}
          )

      it "returns null when no cookie by name is found", ->
        @onRequest('clear:cookie', {domain: "google.com", name: "doesNotExist"})
        .then (resp) ->
          expect(resp).to.be.null

      it "rejects with error", ->
        @onRequest('clear:cookie', {domain: "cdn.github.com", name: "shouldThrow"})
        .then ->
          throw new Error("should have failed")
        .catch (err) ->
          expect(err.message).to.eq("some error")

    describe "take:screenshot", ->
      it "resolves with base64 data URL", ->
        @sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
        @sendDebuggerCommand.withArgs('Page.captureScreenshot').resolves({ data: 'foo' })

        expect(@onRequest('take:screenshot'))
        .to.eventually.equal('data:image/png;base64,foo')

      it "rejects nicely if Page.captureScreenshot fails", ->
        @sendDebuggerCommand.withArgs('Browser.getVersion').resolves({ protocolVersion: '1.3' })
        @sendDebuggerCommand.withArgs('Page.captureScreenshot').rejects()

        expect(@onRequest('take:screenshot'))
        .to.be.rejectedWith('The browser responded with an error when Cypress attempted to take a screenshot.')
