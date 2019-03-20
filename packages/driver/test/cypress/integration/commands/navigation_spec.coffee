$ = Cypress.$.bind(Cypress)
_ = Cypress._
Promise = Cypress.Promise

Cookie = require("js-cookie")

describe "src/cy/commands/navigation", ->
  context "#reload", ->
    before ->
      cy
        .visit("/fixtures/generic.html")
        .then (win) ->
          @body = win.document.body.outerHTML

    beforeEach ->
      doc = cy.state("document")
      @win = cy.state("window")

      $(doc.body).empty().html(@body)

    afterEach ->
      cy.state("window", @win)

    it "calls into window.location.reload", ->
      locReload = cy.spy(Cypress.utils, "locReload")

      cy.reload().then ->
        expect(locReload).to.be.calledWith(false)

    it "can pass forceReload", ->
      locReload = cy.spy(Cypress.utils, "locReload")

      cy.reload(true).then ->
        expect(locReload).to.be.calledWith(true)

    it "can pass forceReload + options", ->
      locReload = cy.spy(Cypress.utils, "locReload")

      cy.reload(true, {}).then ->
        expect(locReload).to.be.calledWith(true)

    it "can pass just options", ->
      locReload = cy.spy(Cypress.utils, "locReload")

      cy.reload({}).then ->
        expect(locReload).to.be.calledWith(false)

    it "returns the window object", ->
      cy
        .window().then (oldWin) ->
          oldWin.foo = "bar"
          expect(oldWin.foo).to.eq("bar")

          cy.reload().then (win) ->
            expect(win).not.to.be.undefined
            expect(win.foo).to.be.undefined

            expect(win).to.eq(cy.state("window"))

    it "removes window:load listeners", ->
      listeners = cy.listeners("window:load")

      winLoad = cy.spy(cy, "once").withArgs("window:load")

      cy.reload().then ->
        expect(winLoad).to.be.calledOnce

        expect(cy.listeners("window:load")).to.deep.eq(listeners)

    ## TODO: fix this
    it.skip "(FLAKY) sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = cy.spy(Promise.prototype, "timeout")

      Cypress.config("pageLoadTimeout", 4567)

      cy.reload().then ->
        expect(timeout).to.be.calledWith(4567, "reload")

    it "fires stability:changed and window events events", ->
      stub1 = cy.stub()
      stub2 = cy.stub()
      stub3 = cy.stub()

      cy.on("stability:changed", stub1)
      cy.on("window:before:unload", stub2)
      cy.on("window:unload", stub3)

      cy.reload().then ->
        expect(stub1.firstCall).to.be.calledWith(false, "beforeunload")
        expect(stub1.secondCall).to.be.calledWith(true, "load")
        expect(stub2).to.be.calledOnce
        expect(stub3).to.be.calledOnce

    it "removes listeners", ->
      win = cy.state("window")

      rel = cy.stub(win, "removeEventListener")

      cy.reload().then ->
        expect(rel).to.be.calledWith("beforeunload")
        expect(rel).to.be.calledWith("unload")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "logs once on failure", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          done()

        cy.reload(Infinity)

      it "throws passing more than 2 args", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        cy.reload(1, 2, 3)

      it "throws passing 2 invalid arguments", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        cy.reload(true, 1)

      it "throws passing 1 invalid argument", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        cy.reload(1)

      it "fully refreshes page", ->
        cy
          .window().then (win) ->
            win.foo = "foo"
          .reload()
          .window().then (win) ->
            expect(win.foo).to.be.undefined

      it "throws when reload times out", (done) ->
        locReload = cy.spy(Cypress.utils, "locReload")

        cy
          .visit("/timeout?ms=100").then ->
            expected = false

            ## wait until the window finishes loading first
            ## else we can potentially move onto the next test
            ## while we're still unstable, which will result in
            ## properties on the window being inaccessible
            ## since we only visit once at the beginning of these tests
            cy.on "window:load", ->
              expect(expected).to.be.true
              done()

            cy.on "fail", (err) ->
              expected = true

              expect(err.message).to.include "Your page did not fire its 'load' event within '1ms'."

          .reload({timeout: 1})

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "reload"
            @lastLog = log

          @logs.push(log)

        return null

      it "logs reload", ->
        cy.reload().then ->
          expect(@lastLog.get("name")).to.eq("reload")

      it "can turn off logging", ->
        cy.reload({log: false}).then ->
          expect(@lastLog).to.be.undefined

      it "does not log 'Page Load' events", ->
        cy.reload().then ->
          @logs.slice(0).forEach (log) ->
            expect(log.get("event")).to.be.false

      it "logs before + after", ->
        beforeunload = false

        cy
          .window().then (win) ->
            cy.on "window:before:unload", =>
              lastLog = @lastLog

              beforeunload = true
              expect(lastLog.get("snapshots").length).to.eq(1)
              expect(lastLog.get("snapshots")[0].name).to.eq("before")
              expect(lastLog.get("snapshots")[0].body).to.be.an("object")

              return undefined

          .reload().then ->
            lastLog = @lastLog

            expect(beforeunload).to.be.true
            expect(lastLog.get("snapshots").length).to.eq(2)
            expect(lastLog.get("snapshots")[1].name).to.eq("after")
            expect(lastLog.get("snapshots")[1].body).to.be.an("object")

  context "#go", ->
    before ->
      cy
        .visit("/fixtures/generic.html")
        .then (win) ->
          @body = win.document.body.outerHTML

    beforeEach ->
      doc = cy.state("document")

      $(doc.body).empty().html(@body)

    ## TODO: fix this
    it.skip "(FLAKY) sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = cy.spy Promise.prototype, "timeout"
      Cypress.config("pageLoadTimeout", 4567)

      cy
        .visit("/fixtures/jquery.html")
        .go("back").then ->
          expect(timeout).to.be.calledWith(4567, "go")

    it "removes listeners", ->
      cy
        .visit("/fixtures/jquery.html")
        .then ->
          winLoadListeners = cy.listeners("window:load")
          beforeWinUnloadListeners = cy.listeners("window:before:unload")

          cyOn = cy.spy(cy, "once")

          winLoad = cyOn.withArgs("window:load")
          beforeWinUnload = cyOn.withArgs("window:before:unload")

          cy.go("back").then ->
            expect(winLoad).to.be.calledOnce
            expect(beforeWinUnload).to.be.calledOnce

            expect(cy.listeners("window:load")).to.deep.eq(winLoadListeners)
            expect(cy.listeners("window:before:unload")).to.deep.eq(beforeWinUnloadListeners)

    it "fires stability:changed and window events events", ->
      stub1= cy.stub()
      stub2 = cy.stub()
      stub3 = cy.stub()

      cy
        .visit("/fixtures/jquery.html")
        .then ->
          cy.on("stability:changed", stub1)
          cy.on("window:before:unload", stub2)
          cy.on("window:unload", stub3)
        .go("back").then ->
          expect(stub1.firstCall).to.be.calledWith(false, "beforeunload")
          expect(stub1.secondCall).to.be.calledWith(true, "load")
          expect(stub2).to.be.calledOnce
          expect(stub3).to.be.calledOnce

    it "removes listeners from window", ->
      cy
        .visit("/fixtures/jquery.html")
        .then (win) ->
          rel = cy.stub(win, "removeEventListener")

          cy.go("back").then ->
            expect(rel).to.be.calledWith("beforeunload")
            expect(rel).to.be.calledWith("unload")

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "go"
            @lastLog = log
            @logs.push(log)

        return null

      _.each [null, undefined, NaN, Infinity, {}, [], ->], (val) =>
        it "throws on: '#{val}'", (done) ->
          cy.on "fail", (err) ->
            expect(err.message).to.eq("cy.go() accepts only a string or number argument")
            done()

          cy.go(val)

      it "throws on invalid string", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.go() accepts either 'forward' or 'back'. You passed: 'foo'")
          done()

        cy.go("foo")

      it "throws on zero", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.go() cannot accept '0'. The number must be greater or less than '0'.")
          done()

        cy.go(0)

      it "throws when go times out", (done) ->
        cy
          .visit("/timeout?ms=100")
          .visit("/fixtures/jquery.html")
          .then ->
            expected = false

            ## wait until the window finishes loading first
            ## else we can potentially move onto the next test
            ## while we're still unstable, which will result in
            ## properties on the window being inaccessible
            ## since we only visit once at the beginning of these tests
            cy.on "window:load", ->
              expect(expected).to.be.true
              done()

            cy.on "fail", (err) ->
              expected = true

              expect(err.message).to.include "Your page did not fire its 'load' event within '1ms'."

            cy.go("back", {timeout: 1})

      it "only logs once on error", (done) ->
        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          expect(@logs[0].get("error")).to.eq(err)
          done()

        cy
          .visit("/fixtures/jquery.html")
          .go("back", {timeout: 1})

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "go"
            @lastLog = log

          @logs.push(log)

        return null

      it "logs go", ->
        cy
          .visit("/fixtures/jquery.html")
          .go("back").then ->
            lastLog = @lastLog

            expect(lastLog.get("name")).to.eq("go")
            expect(lastLog.get("message")).to.eq("back")

      it "can turn off logging", ->
        cy
          .visit("/fixtures/jquery.html")
          .go("back", {log: false}).then ->
            expect(@lastLog).to.be.undefined

      it "does not log 'Page Load' events", ->
        cy
          .visit("/fixtures/jquery.html")
          .go("back").then ->
            @logs.slice(0).forEach (log) ->
              expect(log.get("event")).to.be.false

      it "logs before + after", ->
        beforeunload = false

        cy
          .visit("/fixtures/jquery.html")
          .window().then (win) ->
            cy.on "window:before:unload", =>
              lastLog = @lastLog

              beforeunload = true
              expect(lastLog.get("snapshots").length).to.eq(1)
              expect(lastLog.get("snapshots")[0].name).to.eq("before")
              expect(lastLog.get("snapshots")[0].body).to.be.an("object")

              return undefined

            cy.go("back").then ->
              lastLog = @lastLog

              expect(beforeunload).to.be.true
              expect(lastLog.get("snapshots").length).to.eq(2)
              expect(lastLog.get("snapshots")[1].name).to.eq("after")
              expect(lastLog.get("snapshots")[1].body).to.be.an("object")

  context "#visit", ->
    ## TODO: fix this
    it.skip "(FLAKY) sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = cy.spy Promise.prototype, "timeout"

      Cypress.config("pageLoadTimeout", 4567)

      cy.visit("/fixtures/jquery.html").then ->
        expect(timeout).to.be.calledWith(4567)

    it "removes window:load listeners", ->
      listeners = cy.listeners("window:load")

      winLoad = cy.spy(cy, "once").withArgs("window:load")

      cy.visit("/fixtures/generic.html").then ->
        ## once for about:blank, once for $iframe src
        expect(winLoad).to.be.calledTwice

        expect(cy.listeners("window:load")).to.deep.eq(listeners)

    it "can visit pages on the same originPolicy", ->
      cy
        .visit("http://localhost:3500/fixtures/jquery.html")
        .visit("http://localhost:3500/fixtures/generic.html")
        .visit("http://localhost:3500/fixtures/dimensions.html")

    it "resolves the subject to the remote iframe window", ->
      cy.visit("/fixtures/jquery.html").then (win) ->
        expect(win).to.eq cy.state("$autIframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      cy.visit("/fixtures/jquery.html").then ->
        src = cy.state("$autIframe").attr("src")
        expect(src).to.eq "http://localhost:3500/fixtures/jquery.html"

    it "invokes onLoad callback", (done) ->
      ctx = @

      cy.visit("/fixtures/jquery.html", {
        onLoad: (contentWindow) ->
          thisValue = @ is ctx

          expect(thisValue).be.true
          expect(!!contentWindow.Cypress).to.be.true
          done()
      })

    it "invokes onBeforeLoad callback with cy context", (done) ->
      ctx = @

      cy.visit("/fixtures/jquery.html", {
        onBeforeLoad: (contentWindow) ->
          thisValue = @ is ctx

          expect(thisValue).be.true

          expect(!!contentWindow.Cypress).to.be.true
          done()
      })

    it "does not error without an onBeforeLoad callback", ->
      cy.visit("/fixtures/jquery.html").then ->
        prev = cy.state("current").get("prev")
        expect(prev.get("args")).to.have.length(1)

    it "calls resolve:url with http:// when localhost", ->
      backend = cy.spy(Cypress, "backend")

      cy
        .visit("localhost:3500/timeout")
        .then ->
          expect(backend).to.be.calledWith("resolve:url", "http://localhost:3500/timeout")

    it "prepends hostname when visiting locally", ->
      prop = cy.spy(cy.state("$autIframe"), "prop")

      cy
        .visit("fixtures/jquery.html")
        .then ->
          expect(prop).to.be.calledWith("src", "http://localhost:3500/fixtures/jquery.html")

    it "can visit relative pages on the same originPolicy", ->
      ## as long as we are already on the localhost:3500
      ## domain this will work

      cy
        .visit("http://localhost:3500/fixtures/dimensions.html")
        .visit("/fixtures/jquery.html")

    it "can visit relative pages with domain like query params", ->
      cy
        .visit("http://localhost:3500/fixtures/generic.html")
        .visit("http://localhost:3500/fixtures/dimensions.html?email=briancypress.io")

    it "can visit pages with non-2xx status codes when option failOnStatusCode is false", ->
      cy
        .visit("localhost:3500/status-404", { failOnStatusCode: false })
        .visit("localhost:3500/status-500", { failOnStatusCode: false })

    it "strips username + password out of the url when provided", ->
      backend = cy.spy(Cypress, "backend")

      cy
        .visit("http://cypress:password123@localhost:3500/timeout")
        .then ->
          expect(backend).to.be.calledWith("resolve:url", "http://localhost:3500/timeout")

    it "passes auth options", ->
      backend = cy.spy(Cypress, "backend")

      auth = {
        username: "cypress"
        password: "password123"
      }

      cy
        .visit("http://localhost:3500/timeout", { auth })
        .then ->
          expect(backend).to.be.calledWithMatch("resolve:url", "http://localhost:3500/timeout", { auth })

    describe "when only hashes are changing", ->
      it "short circuits the visit if the page will not refresh", ->
        count = 0
        urls = []

        cy.on "window:load", ->
          urls.push cy.state("window").location.href

          count += 1

        cy
          ## about:blank yes (1)
          .visit("/fixtures/generic.html?foo#bar") ## yes (2)
          .visit("/fixtures/generic.html?foo#foo") ## no (2)
          .visit("/fixtures/generic.html?bar#bar") ## yes (3)
          .visit("/fixtures/dimensions.html?bar#bar") ## yes (4)
          .visit("/fixtures/dimensions.html?baz#bar") ## yes (5)
          .visit("/fixtures/dimensions.html#bar") ## yes (6)
          .visit("/fixtures/dimensions.html") ## yes (7)
          .visit("/fixtures/dimensions.html#baz") ## no (7)
          .visit("/fixtures/dimensions.html#") ## no (7)
          .then ->
            expect(count).to.eq(7)
            expect(urls).to.deep.eq([
              "about:blank"
              "http://localhost:3500/fixtures/generic.html?foo#bar"
              "http://localhost:3500/fixtures/generic.html?bar#bar"
              "http://localhost:3500/fixtures/dimensions.html?bar#bar"
              "http://localhost:3500/fixtures/dimensions.html?baz#bar"
              "http://localhost:3500/fixtures/dimensions.html#bar"
              "http://localhost:3500/fixtures/dimensions.html"
            ])

    ## https://github.com/cypress-io/cypress/issues/1311
    it "window immediately resolves and doesn't reload when visiting the same URL with hashes", ->
      onLoad = cy.stub()

      cy
        .visit("http://localhost:3500/fixtures/generic.html#foo").then (win) ->
          win.foo = 'bar'
        .visit("http://localhost:3500/fixtures/generic.html#foo", {
          onLoad: onLoad
        }).then (win) ->
          expect(win.bar).to.not.exist
          expect(onLoad).not.to.have.been.called

    it "can send headers", ->
      cy.visit({
        url: "http://localhost:3500/dump-headers",
        headers: {
          "x-foo-baz": "bar-quux"
        }
      })
      cy.contains('"x-foo-baz":"bar-quux"')

    describe "can send a POST request", ->
      it "automatically urlencoded using an object body", ->
        cy.visit("http://localhost:3500/post-only", {
          method: "POST",
          body: {
            bar: "baz"
          }
        })
        cy.contains("it worked!").contains("{\"bar\":\"baz\"}")

      it "with any string body and headers", ->
        cy.visit("http://localhost:3500/post-only", {
          method: "POST",
          headers: {
            "content-type": "application/json"
          }
          body: JSON.stringify({
            bar: "baz"
          })
        })
        cy.contains("it worked!").contains("{\"bar\":\"baz\"}")

    describe "when origins don't match", ->
      beforeEach ->
        Cypress.emit("test:before:run", { id: 888 })

        cy.stub(Cypress, "getEmissions").returns([])
        cy.stub(Cypress, "getTestsState").returns([])
        cy.stub(Cypress, "getStartTime").returns("12345")
        cy.stub(Cypress.Log, "countLogsByTests").withArgs([]).returns(1)
        cy.stub(Cypress, "countByTestState")
        .withArgs([], "passed").returns(2)
        .withArgs([], "failed").returns(3)
        .withArgs([], "pending").returns(4)

      it "emits preserve:run:state with title + fn", (done) ->
        obj = {
          currentId: 888
          tests: []
          emissions: []
          startTime: "12345"
          numLogs: 1
          passed: 2
          failed: 3
          pending: 4
        }

        fn = (eventName, state) ->
          _.each obj, (value, key) ->
            expect(state[key]).to.deep.eq(value)

          done()

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          url: "http://localhost:4200"
        })
        .withArgs("preserve:run:state")
        .callsFake(fn)

        cy.visit("http://localhost:4200")

      it "replaces window.location when origins don't match", (done) ->
        fn = (str, win) ->
          isEqual = win is top.window

          expect(isEqual).to.be.true
          expect(str).to.eq("http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js")

          done()

        fakeUrl = Cypress.Location.create("http://localhost:3500/foo?bar=baz#/tests/integration/foo_spec.js")

        cy.stub(Cypress.utils, "locExisting").returns(fakeUrl)
        cy.stub(Cypress.utils, "locHref")
        .callThrough()
        .withArgs("http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js")
        .callsFake(fn)

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          url: "http://localhost:4200"
        })
        .withArgs("preserve:run:state")
        .resolves()

        cy.visit("http://localhost:4200")

    describe "location getter overrides", ->
      before ->
        cy
          .visit("/fixtures/jquery.html?foo=bar#dashboard?baz=quux")
          .window().as("win").then (win) ->
            ## ensure href always returns the full path
            ## so our tests guarantee that in fact we are
            ## overriding the location getters
            expect(win.location.href).to.include "/fixtures/jquery.html?foo=bar#dashboard?baz=quux"

      beforeEach ->
        @win = cy.state("window")

        @eq = (attr, str) =>
          expect(@win.location[attr]).to.eq str

      it "hash", ->
        @eq "hash", "#dashboard?baz=quux"

      it "hostname", ->
        @eq "hostname", "localhost"

      it "origin", ->
        @eq "origin", "http://localhost:3500"

      it "pathname", ->
        @eq "pathname", "/fixtures/jquery.html"

      it "port", ->
        @eq "port", "3500"

      it "protocol", ->
        @eq "protocol", "http:"

      it "search", ->
        @eq "search", "?foo=bar"

    describe ".log", ->
      beforeEach ->
        cy.stub(Cypress, "getEmissions").returns([])

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "visit"
            @lastLog = log

          @logs.push(log)

        return null

      it "preserves url on subsequent visits", ->
        cy.visit("/fixtures/jquery.html").get("button").then ->
          expect(@lastLog.get("url")).to.eq "http://localhost:3500/fixtures/jquery.html"

      it "does not log 'Page Load' events", ->
        cy
          .visit("/fixtures/generic.html")
          .visit("/fixtures/jquery.html")
          .then ->
            @logs.slice(0).forEach (log) ->
              expect(log.get("event")).to.be.false

      it "logs immediately before resolving", ->
        expected = false

        cy.on "log:added", (attrs, log) ->
          cy.removeAllListeners("log:added")

          expect(log.pick("name", "message")).to.deep.eq {
            name: "visit"
            message: "localhost:3500/fixtures/jquery.html#/hash"
          }

          expected = true

        cy.visit("localhost:3500/fixtures/jquery.html#/hash").then ->
          expect(expected).to.be.true

      it "logs obj once complete", ->
        cy.visit("http://localhost:3500/fixtures/generic.html").then ->
          obj = {
            state: "passed"
            name: "visit"
            message: "http://localhost:3500/fixtures/generic.html"
            url: "http://localhost:3500/fixtures/generic.html"
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "logs obj once complete when onLoad is not called", ->
        cy.visit("http://localhost:3500/fixtures/generic.html#foo")
        cy.visit("http://localhost:3500/fixtures/generic.html#foo").then ->
          obj = {
            state: "passed"
            name: "visit"
            message: "http://localhost:3500/fixtures/generic.html#foo"
            url: "http://localhost:3500/fixtures/generic.html#foo"
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "snapshots once", ->
        cy.visit("/fixtures/generic.html").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "can turn off logging", ->
        cy.visit("/timeout?ms=0", {log: false}).then ->
          expect(@lastLog).not.to.exist

      it "displays file attributes as consoleProps", ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          filePath: "/path/to/foo/bar"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        cy.visit("/fixtures/jquery.html").then ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq({
            "Command": "visit"
            "File Served": "/path/to/foo/bar"
            "Resolved Url": "http://localhost:3500/foo/bar"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "displays http attributes as consoleProps", ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        cy.visit("http://localhost:3500/foo").then ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq({
            "Command": "visit"
            "Resolved Url": "http://localhost:3500/foo"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "displays originalUrl http attributes as consoleProps", ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        cy.visit("http://localhost:3500/foo").then ->
          expect(@lastLog.invoke("consoleProps")).to.deep.eq({
            "Command": "visit"
            "Original Url": "http://localhost:3500/foo"
            "Resolved Url": "http://localhost:3500/foo/bar"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "indicates redirects in the message", ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        cy.visit("http://localhost:3500/foo").then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq(
            "http://localhost:3500/foo -> 1 -> 2"
          )

      it "indicates POST in the message", ->
        cy.visit("http://localhost:3500/post-only", {
          method: "POST"
        }).then ->
          lastLog = @lastLog

          expect(lastLog.get("message")).to.eq(
            "POST http://localhost:3500/post-only"
          )

      it "displays note in consoleProps when visiting the same page with a hash", ->
        cy.visit("http://localhost:3500/fixtures/generic.html#foo")
          .visit("http://localhost:3500/fixtures/generic.html#foo")
          .then ->
            expect(@lastLog.invoke("consoleProps")).to.deep.eq({
              "Command": "visit"
              "Note": "Because this visit was to the same hash, the page did not reload and the onBeforeLoad and onLoad callbacks did not fire."
          })

      it "logs options if they are supplied", ->
        cy.visit({
          url: "http://localhost:3500/fixtures/generic.html"
          headers: {
            "foo": "bar"
          },
          notReal: "baz"
        })
        .then ->
          expect(@lastLog.invoke("consoleProps")["Options"]).to.deep.eq({
            url: "http://localhost:3500/fixtures/generic.html"
            headers: {
              "foo": "bar"
            }
          })

      it "does not log options if they are not supplied", ->
        cy.visit("http://localhost:3500/fixtures/generic.html")
        .then ->
          expect(@lastLog.invoke("consoleProps")["Options"]).to.be.undefined

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 50)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          if attrs.name is "visit"
            @lastLog = log
            @logs.push(log)

        return null

      it "sets error command state", (done) ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .rejects(new Error)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(lastLog.get("state")).to.eq "failed"
          expect(lastLog.get("error")).to.eq err
          done()

        cy.visit("/fixtures/generic.html")

      it "logs once on error", (done) ->
        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .rejects(new Error)

        cy.on "fail", (err) =>
          expect(@logs.length).to.eq(1)
          done()

        cy.visit("/fixtures/generic.html")

      it "logs once on timeout error", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(1)
          expect(err.message).to.include "Your page did not fire its 'load' event within '20ms'."
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("/timeout?ms=5000", {timeout: 20})

      it "cancels resolve url promise on timeout", (done) ->
        cy.on "collect:run:state", ->
          done(new Error("should not have tried to swap domains"))

        fn = ->
          ## resolve after 100ms
          Promise.delay(100)
          .then ->
            done(new Error("should not have invoked this callback"))

        p = cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .callsFake(fn)

        cy.on "fail", -> done()

        cy.visit("/", {timeout: 20})

      it "throws when url isnt a string", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.visit() must be called with a URL or an options object containing a URL as its 1st argument"
          done()

        cy.visit()

      it "throws when url is specified twice", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.contain "cy.visit() must be called with only one URL. You specified two URLs"
          done()

        cy.visit("http://foobarbaz", {
          url: "http://foobarbaz"
        })

      it "throws when method is unsupported", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.contain "cy.visit() was called with an invalid method: 'FOO'"
          done()

        cy.visit({
          url: "http://foobarbaz",
          method: "FOO"
        })

      it "throws when headers is not an object", (done) ->
        cy.on "fail", (err) ->
          expect(err.message).to.contain "cy.visit() requires the 'headers' option to be an object"
          done()

        cy.visit({
          url: "http://foobarbaz",
          headers: "quux"
        })

      it "throws when attempting to visit a 2nd domain on different port", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy
          .visit("http://localhost:3500/fixtures/generic.html")
          .visit("http://localhost:3501/fixtures/generic.html")

      it "throws when attempting to visit a 2nd domain on different protocol", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy
          .visit("http://localhost:3500/fixtures/generic.html")
          .visit("https://localhost:3500/fixtures/generic.html")

      it "throws when attempting to visit a 2nd domain on different host", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy
          .visit("http://localhost:3500/fixtures/generic.html")
          .visit("http://google.com:3500/fixtures/generic.html")

      it "throws attemping to visit 2 unique ip addresses", (done) ->
        $autIframe = cy.state("$autIframe")

        load = ->
          $autIframe.trigger("load")

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves({
          isOkStatusCode: true
          isHtml: true
          url: "http://127.0.0.1:3500"
        })

        ## whenever we're told to change the src
        ## just fire the load event directly on the $autIframe
        cy.stub(Cypress.utils, "iframeSrc").callsFake(load)

        ## make it seem like we're already on http://127.0.0.1:3500
        one = Cypress.Location.create("http://127.0.0.1:3500/fixtures/generic.html")
        cy.stub(Cypress.utils, "locExisting")
        .returns(one)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(@logs.length).to.eq(2)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy
          .visit("http://127.0.0.1:3500/fixtures/generic.html")
          .visit("http://126.0.0.1:3500/fixtures/generic.html")

      it "does not call resolve:url when throws attemping to visit a 2nd domain", (done) ->
        backend = cy.spy(Cypress, "backend")

        cy.on "fail", (err) =>
          expect(backend).to.be.calledWithMatch("resolve:url", "http://localhost:3500/fixtures/generic.html")
          expect(backend).not.to.be.calledWithMatch("resolve:url", "http://google.com:3500/fixtures/generic.html")
          done()

        cy
          .visit("http://localhost:3500/fixtures/generic.html")
          .visit("http://google.com:3500/fixtures/generic.html")

      it "displays loading_network_failed when _resolveUrl throws", (done) ->
        err1 = new Error("connect ECONNREFUSED 127.0.0.1:64646")

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        backend = cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .rejects(err1)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            http://localhost:3500/foo.html

            We attempted to make an http request to this URL but the request failed without a response.

            We received this error at the network level:

              > Error: connect ECONNREFUSED 127.0.0.1:64646

            Common situations why this would fail:
              - you don't have internet access
              - you forgot to run / boot your web server
              - your web server isn't accessible
              - you have weird network configuration settings on your computer

            The stack trace for this error is:
          """)
          expect(err1.url).to.include("/foo.html")
          expect(emit).to.be.calledWith("visit:failed", err1)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("/foo.html")

      it "displays loading_file_failed when _resolveUrl resp is not ok", (done) ->
        obj = {
          isOkStatusCode: false
          isHtml: true
          contentType: "text/html"
          originalUrl: "/foo.html"
          filePath: "/path/to/foo.html"
          status: 404
          statusText: "Not Found"
          redirects: []
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves(obj)

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            /foo.html

            We failed looking for this file at the path:

            /path/to/foo.html

            The internal Cypress web server responded with:

              > 404: Not Found
          """)
          expect(emit).to.be.calledWithMatch("visit:failed", obj)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("/foo.html")

      it "displays loading_file_failed redirects when _resolveUrl resp is not ok", (done) ->
        obj = {
          isOkStatusCode: false
          isHtml: true
          contentType: "text/html"
          originalUrl: "/bar"
          filePath: "/path/to/bar/"
          status: 404
          statusText: "Not Found"
          redirects: [
            "301: http://localhost:3500/bar/"
          ]
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url")
        .resolves(obj)

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            /bar

            We failed looking for this file at the path:

            /path/to/bar/

            The internal Cypress web server responded with:

              > 404: Not Found

            We were redirected '1' time to:

              - 301: http://localhost:3500/bar/
          """)
          expect(emit).to.be.calledWithMatch("visit:failed", obj)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("/bar")

      it "displays loading_http_failed when _resolveUrl resp is not ok", (done) ->
        obj = {
          isOkStatusCode: false
          isHtml: true
          contentType: "text/html"
          originalUrl: "https://google.com/foo"
          status: 500
          statusText: "Server Error"
          redirects: []
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url", "https://google.com/foo")
        .resolves(obj)

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not '2xx'.

            If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'
          """)
          expect(emit).to.be.calledWithMatch("visit:failed", obj)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("https://google.com/foo")

      it "displays loading_http_failed redirects when _resolveUrl resp is not ok", (done) ->
        obj = {
          isOkStatusCode: false
          isHtml: true
          contentType: "text/html"
          originalUrl: "https://google.com/foo"
          status: 401
          statusText: "Unauthorized"
          redirects: [
            "302: https://google.com/bar/"
            "301: https://gmail.com/"
          ]
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url", "https://google.com/foo")
        .resolves(obj)

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 401: Unauthorized

            This was considered a failure because the status code was not '2xx'.

            This http request was redirected '2' times to:

              - 302: https://google.com/bar/
              - 301: https://gmail.com/

            If you do not want status codes to cause failures pass the option: 'failOnStatusCode: false'
          """)
          expect(emit).to.be.calledWithMatch("visit:failed", obj)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("https://google.com/foo")

      ## https://github.com/cypress-io/cypress/issues/3101
      [{
        contentType: 'application/json',
        pathName: 'json-content-type'
      }, {
        contentType: 'text/html; charset=utf-8,text/html',
        pathName: 'invalid-content-type'
      }]
      .forEach ({contentType, pathName}) ->
        it "displays loading_invalid_content_type when content type is #{contentType} on http requests", (done) ->
          cy.on "fail", (err) =>
            lastLog = @lastLog

            expect(err.message).to.include("""
              cy.visit() failed trying to load:

              http://localhost:3500/#{pathName}

              The content-type of the response we received from your web server was:

                > #{contentType}

              This was considered a failure because responses must have content-type: 'text/html'

              However, you can likely use cy.request() instead of cy.visit().

              cy.request() will automatically get and set cookies and enable you to parse responses.
            """)
            expect(@logs.length).to.eq(1)
            expect(lastLog.get("error")).to.eq(err)
            done()

          cy.visit("http://localhost:3500/#{pathName}")

      it "displays loading_invalid_content_type when isHtml is false on file requests", (done) ->
        obj = {
          isOkStatusCode: true
          isHtml: false
          filePath: "/path/to/bar/"
          contentType: "application/json"
          originalUrl: "https://google.com/foo"
          status: 200
          statusText: "OK"
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        cy.stub(Cypress, "backend")
        .withArgs("resolve:url", "https://google.com/foo")
        .resolves(obj)

        ## dont log else we create an endless loop!
        emit = cy.spy(Cypress, "emit").log(false)

        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The content-type of the response we received from this local file was:

              > application/json

            This was considered a failure because responses must have content-type: 'text/html'

            However, you can likely use cy.request() instead of cy.visit().

            cy.request() will automatically get and set cookies and enable you to parse responses.
          """)
          expect(emit).to.be.calledWithMatch("visit:failed", obj)
          expect(@logs.length).to.eq(1)
          expect(lastLog.get("error")).to.eq(err)
          done()

        cy.visit("https://google.com/foo")

  context "#page load", ->
    it "sets initial=true and then removes", ->
      Cookie.remove("__cypress.initial")

      expect(Cookie.get("__cypress.initial")).to.be.undefined

      expected = false

      cy.on "window:before:unload", ->
        expected = true
        expect(Cookie.get("__cypress.initial")).to.eq("true")

      ## this navigates us to a new page so
      ## we should be setting the initial cookie
      cy
        .visit("/fixtures/form.html")
        .then ->
          cy.once "window:unload", ->
            expect(cy.state("onPageLoadErr")).to.be.a("function")

          null
        .get("a:first").click().then ->
          listeners = cy.listeners("window:load")

          ## everything should have unbound properly
          expect(listeners.length).to.eq(0)

          expect(expected).to.be.true

          expect(cy.state("onPageLoadErr")).to.be.null

          expect(Cookie.get("__cypress.initial")).to.be.undefined

    it "does not reset the timeout", (done) ->
      cy.timeout(1000)

      ## previously loading would reset the timeout
      ## which could cause failures on the next test
      ## if there was logic after a test finished running
      cy.window().then (win) =>
        timeout = cy.spy(cy, "timeout")

        ## we are unstable at this point
        cy.on "window:before:unload", ->
          cy.whenStable ->
            expect(timeout).not.to.be.called
            done()

        win.location.href = "about:blank"

    it "does not time out current commands until stability is reached", ->
      ## on the first retry cause a page load event synchronously
      cy.on "command:retry", (options) ->
        switch options._retries
          when 1
            win = cy.state("window")

            ## load a page which times out after 500ms
            ## to guarantee that url does not time out
            $a = win.$("<a href='/timeout?ms=500'>jquery</a>")
            .appendTo(win.document.body)

            ## this causes a synchronous beforeunload event
            ## unlike win.location.href setter
            $a.get(0).click()

          when 2
            ## on 2nd retry add the DOM element
            win = cy.state("window")
            $("<div id='does-not-exist'>does not exist<div>")
            .appendTo(win.document.body)

          when 3
            ## and on the 3rd retry add the class
            win = cy.state("window")
            $("#does-not-exist").addClass("foo")

      cy
        .visit("/fixtures/jquery.html")

        ## make get timeout after 300ms
        ## but even though our page does not load for 500ms
        ## this does not time out
        .get("#does-not-exist", { timeout: 300 }).should("have.class", "foo")

    describe "errors", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "can time out", (done) ->
        thenCalled = false

        cy.on "fail", (err) =>
          lastLog = @lastLog

          ## visit, window, page loading
          expect(@logs.length).to.eq(3)
          expect(err.message).to.include "Your page did not fire its 'load' event within '50ms'."
          expect(lastLog.get("name")).to.eq("page load")
          expect(lastLog.get("error")).to.eq(err)

          Promise
          .delay(100)
          .then ->
            expect(cy.state("onPageLoadErr")).to.be.null
            expect(cy.isStopped()).to.be.true ## make sure we ran our cleanup routine
            expect(thenCalled).to.be.false

            done()

        cy
          .visit("/fixtures/jquery.html")
          .window().then (win) ->
            Cypress.config("pageLoadTimeout", 50)

            $a = win.$("<a href='/timeout?ms=500'>jquery</a>")
            .appendTo(win.document.body)

            ## this causes a synchronous beforeunload event
            ## unlike win.location.href setter
            $a.get(0).click()

            null
          .wrap(null).then ->
            thenCalled = true

      it "does time out once stability is reached", (done) ->
        logByName = (name) =>
          _.find @logs, (log) ->
            log.get("name") is name

        cy.on "fail", (err) ->
          cy.on "command:retry", ->
            throw new Error("should not have retried twice")

          expect(err.message).to.include("Expected to find element")

          get = logByName("get")

          expect(get.get("error")).to.eq(err)

          Promise.delay(200)
          .then ->
            expect(cy.isStopped()).to.be.true

            done()

        start = null

        ## on the first retry cause a page load event synchronously
        cy.on "command:retry", (options) ->
          switch options._retries
            when 1
              ## hold a ref to this
              start = options._start

              win = cy.state("window")

              ## load a page which times out after 400ms
              ## to guarantee that url does not time out
              $a = win.$("<a href='/timeout?ms=400'>jquery</a>")
              .appendTo(win.document.body)

              ## this causes a synchronous beforeunload event
              ## unlike win.location.href setter
              $a.get(0).click()

              ## immediately logs pending state
              expect(logByName("page load").get("state")).to.eq("pending")

            when 2
              ## it should have reset this because we became
              ## unstable
              expect(start).not.to.eq(options._start)

              ## and by the time we retry for the 2nd time
              ## the page should be loaded
              expect(logByName("page load").get("state")).to.eq("passed")

        cy
          .visit("/fixtures/jquery.html")

          ## make get timeout after only 200ms
          .get("#does-not-exist", { timeout: 200 }).should("have.class", "foo")

      it "captures cross origin failures", (done) ->
        cy.once "fail", (err) =>
          lastLog = @lastLog

          expect(@logs.length).to.eq(2)
          expect(err.message).to.include("Cypress detected a cross origin error happened on page load")
          expect(lastLog.get("name")).to.eq("page load")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.eq(err)
          expect(cy.state("onPageLoadErr")).to.be.null

          done()

        cy
          .visit("/fixtures/jquery.html")
          .window({log: false}).then (win) ->
            url = "http://localhost:3501/fixtures/generic.html"

            $a = win.$("<a href='#{url}'>jquery</a>")
            .appendTo(win.document.body)

            $a.get(0).click()

            null

  ## this tests isLoading spinner
  ## and page load event
  context "#page loading", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        if attrs.name is "page load"
          @lastLog = log

          @logs.push(log)

      return null

    it "emits 'page:loading' before and after initial visit", ->
      emit = cy.spy(Cypress, "emit").log(false).withArgs("page:loading")

      cy
        .visit("/timeout?ms=10", {
          onBeforeLoad: ->
            expect(emit).to.be.calledOnce
            expect(emit.firstCall).to.be.calledWith("page:loading", true)
        })
        .then ->
          expect(emit).to.be.calledTwice
          expect(emit.secondCall).to.be.calledWith("page:loading", false)

    it "emits during page navigation", ->
      emit = cy.spy(Cypress, "emit").log(false).withArgs("page:loading")
      expected = false

      cy
        .visit("/fixtures/generic.html")
        .then ->
          cy.once "window:unload", ->
            expected = true
            expect(emit.callCount).to.eq(3)
            expect(emit.thirdCall).to.be.calledWith("page:loading", true)

        .get("#dimensions").click()
        .then ->
          expect(expected).to.be.true
          expect(emit.callCount).to.eq(4)
          expect(emit.getCall(3)).to.be.calledWith("page:loading", false)

    it "does not log during initial visit", ->
      cy.visit("/timeout?ms=10").then ->
        expect(@lastLog).not.to.exist

    it "logs during page navigation", ->
      expected = false

      cy
        .visit("/fixtures/generic.html")
        .then ->
          cy.once "window:before:unload", =>
            expected = true

            expect(@lastLog).to.exist
            expect(@lastLog.get("state")).to.eq("pending")
            expect(@lastLog.get("message")).to.eq("--waiting for new page to load--")
            expect(@lastLog.get("snapshots")).to.be.empty

        .get("#dimensions").click()
        .then ->
          expect(expected).to.be.true
          expect(@lastLog.get("state")).to.eq("passed")
          expect(@lastLog.get("message")).to.eq("--page loaded--")
          expect(@lastLog.get("snapshots")).to.have.length(1)

    it "logs during form submission and yields stale element", ->
      expected = false

      names = cy.queue.names()

      cy
        .visit("/fixtures/form.html")
        .then ->
          $input = cy.$$("form#click-me input[type=submit]")

          cy.once "window:before:unload", =>
            expected = true

            expect(@lastLog).to.exist
            expect(@lastLog.get("state")).to.eq("pending")
            expect(@lastLog.get("message")).to.eq("--waiting for new page to load--")
            expect(@lastLog.get("snapshots")).to.be.empty

          cy
            .get("form#click-me")
            .find("input[type=submit]")
            .click()
            .then (subject) ->
              expect(expected).to.be.true

              expect(@lastLog.get("state")).to.eq("passed")
              expect(@lastLog.get("message")).to.eq("--page loaded--")
              expect(@lastLog.get("snapshots")).to.have.length(1)

              expect(cy.queue.names()).to.deep.eq names.concat([
                "visit", "then", "get", "find", "click", "then"
              ])

              expect(Cypress.dom.isDetached(subject)).to.be.true

              expect(subject.get(0)).to.eq($input.get(0))

    it "waits for stability at the end of the command queue when not stable", (done) ->
      cy
      .visit("/fixtures/generic.html")
      .then (win) ->
        cy.on "window:load", ->
          cy.on "command:queue:end", ->
            done()

        cy.on "command:queue:before:end", ->
          ## force us to become unstable immediately
          ## else the beforeunload event fires at the end
          ## of the tick which is too late
          cy.isStable(false, "testing")

          ## this should cause instability
          win.location.href = "/timeout?ms=100"

        null

  context "#url:changed", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        if attrs.name is "new url"
          @lastLog = log

          @logs.push(log)

      return null

    describe "page navigation", ->
      it "emits url:changed event on initial visit", ->
        emit = cy.spy(Cypress, "emit").log(false).withArgs("url:changed")

        cy
          .visit("/fixtures/generic.html")
          .then ->
            expect(emit).to.be.calledOnce

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

      it "emits url:changed on 2nd visit to different page", ->
        emit = cy.spy(Cypress, "emit").log(false).withArgs("url:changed")

        cy
          .visit("/fixtures/generic.html")
          .visit("/fixtures/jquery.html")
          .then ->
            expect(emit).to.be.calledTwice

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/jquery.html"
            )

      it "does not emit url:changed twice on visit to the same page", ->
        emit = cy.spy(Cypress, "emit").log(false).withArgs("url:changed")

        cy
          .visit("/fixtures/generic.html")
          .visit("/fixtures/generic.html")
          .then ->
            expect(emit).to.be.calledOnce

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

      it "does not log url:changed event on visit", ->
        cy
          .visit("/fixtures/generic.html")
          .then ->
            expect(@lastLog).not.to.exist

      it "emits url:changed event on page navigation", ->
        emit = cy.spy(Cypress, "emit").log(false).withArgs("url:changed")

        cy
          .visit("/fixtures/generic.html")
          .get("#dimensions").click()
          .then ->
            expect(emit).to.be.calledTwice

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/dimensions.html"
            )

      it "logs url:changed event on page navigation", ->
        cy
          .visit("/fixtures/generic.html")
          .get("#dimensions").click()
          .then ->
            expect(@logs.length).to.eq(1)

            expect(@logs[0].get("message")).to.eq(
              "http://localhost:3500/fixtures/dimensions.html"
            )

            expect(@logs[0].invoke("consoleProps")).to.deep.eq({
              "Event": "new url"
              "New Url": "http://localhost:3500/fixtures/dimensions.html"
              "Url Updated By": "page navigation event (before:load)"
            })

    describe "hashchange events", ->
      it "emits url:changed event", ->
        emit = cy.spy(Cypress, "emit").log(false)

        cy
          .visit("/fixtures/generic.html")
          .get("#hashchange").click()
          .then ->
            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html#hashchange"
            )

      it "emits url:changed event as navigation events occur", ->
        emit = cy.spy(Cypress, "emit").log(false).withArgs("url:changed")

        cy
        .visit("/fixtures/generic.html")
        .get("#hashchange").click()
        .window().then (win) ->
          new Promise (resolve) ->
            cy.once "navigation:changed", resolve

            win.history.back()
          .then ->
            new Promise (resolve) ->
              cy.once "navigation:changed", resolve

              win.history.forward()
          .then ->
            expect(emit.callCount).to.eq(4)

            expect(emit.firstCall).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

            expect(emit.secondCall).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html#hashchange"
            )

            expect(emit.thirdCall).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html"
            )

            expect(emit.getCall(3)).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/generic.html#hashchange"
            )

      it "logs url changed event", ->
        cy
          .visit("/fixtures/generic.html")
          .window().then (win) ->
            ohc = null

            win.onhashchange = (event) ->
              ohc = event

            cy
            .get("#hashchange").click()
            .then ->
              lastLog = @lastLog

              expect(lastLog.get("message")).to.eq("http://localhost:3500/fixtures/generic.html#hashchange")
              expect(lastLog.get("type")).to.eq("parent")
              expect(lastLog.get("event")).to.be.true

              expect(lastLog.invoke("consoleProps")).to.deep.eq({
                "Event": "new url"
                "New Url": "http://localhost:3500/fixtures/generic.html#hashchange"
                "Url Updated By": "hashchange"
                "Args": ohc
              })

      it "logs url:changed event as navigation events occur", ->
        cy
        .visit("/fixtures/generic.html")
        .get("#hashchange").click()
        .window().then (win) ->
          new Promise (resolve) ->
            cy.once "navigation:changed", resolve

            win.history.back()
          .then ->
            new Promise (resolve) ->
              cy.once "navigation:changed", resolve

              win.history.forward()
        .then ->
          expect(@logs.length).to.eq(3)

          expect(@logs[0].get("message")).to.eq(
            "http://localhost:3500/fixtures/generic.html#hashchange"
          )

          expect(@logs[1].get("message")).to.eq(
            "http://localhost:3500/fixtures/generic.html"
          )

          expect(@logs[2].get("message")).to.eq(
            "http://localhost:3500/fixtures/generic.html#hashchange"
          )

    describe "history.pushState", ->
      it "emits url:changed event", ->
        emit = cy.spy(Cypress, "emit").log(false)

        cy
          .visit("/fixtures/generic.html")
          .window().then (win) ->
            win.history.pushState({foo: "bar"}, null, "pushState.html")

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/pushState.html"
            )

      it "logs url changed event", ->
        cy
          .visit("/fixtures/generic.html")
          .window().then (win) ->
            win.history.pushState({foo: "bar"}, null, "pushState.html")

            lastLog = @lastLog

            expect(lastLog.get("message")).to.eq("http://localhost:3500/fixtures/pushState.html")
            expect(lastLog.get("type")).to.eq("parent")
            expect(lastLog.get("event")).to.be.true

            expect(lastLog.invoke("consoleProps")).to.deep.eq({
              "Event": "new url"
              "New Url": "http://localhost:3500/fixtures/pushState.html"
              "Url Updated By": "pushState"
              "Args": [
                { foo: "bar" },
                null,
                "pushState.html",
              ]
            })

    describe "history.replaceState", ->
      it "emits url:changed event", ->
        emit = cy.spy(Cypress, "emit").log(false)

        cy
          .visit("/fixtures/generic.html")
          .window().then (win) ->
            win.history.replaceState({foo: "bar"}, null, "replaceState.html")

            expect(emit).to.be.calledWith(
              "url:changed"
              "http://localhost:3500/fixtures/replaceState.html"
            )

      it "logs url changed event", ->
        cy
          .visit("/fixtures/generic.html")
          .window().then (win) ->
            win.history.replaceState({foo: "bar"}, null, "replaceState.html")

            lastLog = @lastLog

            expect(lastLog.get("message")).to.eq("http://localhost:3500/fixtures/replaceState.html")
            expect(lastLog.get("type")).to.eq("parent")
            expect(lastLog.get("event")).to.be.true

            expect(lastLog.invoke("consoleProps")).to.deep.eq({
              "Event": "new url"
              "New Url": "http://localhost:3500/fixtures/replaceState.html"
              "Url Updated By": "replaceState"
              "Args": [
                { foo: "bar" },
                null,
                "replaceState.html",
              ]
            })

  context "#form sub", ->
    beforeEach ->
      @logs = []

      cy.on "log:added", (attrs, log) =>
        if attrs.name is "form sub"
          @lastLog = log

          @logs.push(log)

      return null

    it "logs 'form sub'", ->
      event = null

      cy
        .visit("/fixtures/form.html")
        .then ->
          $form = cy.$$("#click-me").on "submit", (e) ->
            event = e.originalEvent

          cy
          .get("#click-me").find("input[type=submit]").click()
          .then ->
            expect(@logs.length).to.eq(1)

            expect(@logs[0].get("message")).to.eq(
              "--submitting form--"
            )

            expect(@logs[0].invoke("consoleProps")).to.deep.eq({
              "Event": "form sub"
              "Originated From": $form.get(0)
              "Args": event
            })
