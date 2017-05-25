{ $, _, Promise, Cookies } = window.testUtils

describe "$Cypress.Cy Navigation Commands", ->
  enterCommandTestingMode()

  context "#reload", ->
    it "calls into window.location.reload", (done) ->
      fn = (arg) ->
        expect(arg).to.be.false
        done()

      win = {location: {reload: fn}}

      @cy.privateState("window", win)

      @cy.reload()

    it "can pass forceReload", (done) ->
      fn = (arg) ->
        expect(arg).to.be.true
        done()

      win = {location: {reload: fn}}

      @cy.privateState("window", win)

      @cy.reload(true)

    it "can pass forceReload + options", (done) ->
      fn = (arg) ->
        expect(arg).to.be.true
        done()

      win = {location: {reload: fn}}

      @cy.privateState("window", win)

      @cy.reload(true, {})

    it "can pass just options", (done) ->
      fn = (arg) ->
        expect(arg).to.be.false
        done()

      win = {location: {reload: fn}}

      @cy.privateState("window", win)

      @cy.reload({})

    it "returns the window object", ->
      @cy
        .window().then (oldWin) ->
          oldWin.foo = "bar"
          expect(oldWin.foo).to.eq("bar")

          cy.reload().then (win) ->
            expect(win).not.to.be.undefined
            expect(win.foo).to.be.undefined

            expect(win).to.eq(@cy.privateState("window"))

    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = @sandbox.spy Promise.prototype, "timeout"
      @Cypress.config("pageLoadTimeout", 456)

      @cy.on "command:end", (cmd) =>
        if cmd.get("name") is "reload"
          expect(timeout).to.be.calledWith(456)

      @cy.reload()

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "logs once on failure", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs.length).to.eq(1)
          done()

        @cy.reload(Infinity)

      it "throws passing more than 2 args", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        @cy.reload(1, 2, 3)

      it "throws passing 2 invalid arguments", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        @cy.reload(true, 1)

      it "throws passing 1 invalid argument", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq("cy.reload() can only accept a boolean or options as its arguments.")
          done()

        @cy.reload(1)

      it "fully refreshes page", ->
        @cy
          .window().then (win) ->
            win.foo = "foo"
          .reload()
          .window().then (win) ->
            expect(win.foo).to.be.undefined

      it "throws when go times out", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Your page did not fire its 'load' event within '1ms'."
          done()

        @cy
          .reload({timeout: 1})

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      afterEach ->
        delete @log

      it "logs reload", ->
        @cy.reload().then ->
          expect(@log.get("name")).to.eq("reload")

      it "can turn off logging", ->
        @cy.reload({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs before + after", (done) ->
        beforeunload = false

        @cy
          .window().then (win) ->
            $(win).on "beforeunload", =>
              beforeunload = true
              expect(@log.get("snapshots").length).to.eq(1)
              expect(@log.get("snapshots")[0].name).to.eq("before")
              expect(@log.get("snapshots")[0].body).to.be.an("object")
              return undefined

          .reload().then ->
            expect(beforeunload).to.be.true
            expect(@log.get("snapshots").length).to.eq(2)
            expect(@log.get("snapshots")[1].name).to.eq("after")
            expect(@log.get("snapshots")[1].body).to.be.an("object")
            done()

  context "#go", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      @cy
        .visit("/fixtures/sinon.html")
        .then =>
          timeout = @sandbox.spy Promise.prototype, "timeout"
          @Cypress.config("pageLoadTimeout", 456)

          @cy.on "command:end", (cmd) =>
            if cmd.get("name") is "go"
              expect(timeout).to.be.calledWith(456)

          @cy.go("back")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      _.each [null, undefined, NaN, Infinity, {}, [], ->], (val) =>
        it "throws on: '#{val}'", (done) ->
          @Cypress.on "fail", (err) ->
            expect(err.message).to.eq("cy.go() accepts only a string or number argument")
            done()

          @cy.go(val)

      it "throws on invalid string", (done) ->
        @Cypress.on "fail", (err) ->
          expect(err.message).to.eq("cy.go() accepts either 'forward' or 'back'. You passed: 'foo'")
          done()

        @cy.go("foo")

      it "throws on zero", (done) ->
        @Cypress.on "fail", (err) ->
          expect(err.message).to.eq("cy.go() cannot accept '0'. The number must be greater or less than '0'.")
          done()

        @cy.go(0)

      it "throws when go times out", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.include "Your page did not fire its 'load' event within '1ms'."
          done()

        @cy
          .visit("/fixtures/sinon.html")
          .go("back", {timeout: 1})

      it "only logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) =>
          logs.push log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(3)
          expect(logs[1].get("error")).to.eq(err)
          done()

        @cy
          .visit("/foo")
          .go("back", {timeout: 1})

    describe ".log", ->

  context "#visit", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = @sandbox.spy Promise.prototype, "timeout"
      @Cypress.config("pageLoadTimeout", 1500)
      @cy.visit("/foo").then ->
        expect(timeout).to.be.calledWith(1500)

    it "resolves the subject to the remote iframe window", ->
      @cy.visit("/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      @cy.visit("/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "http://localhost:3500/foo"

    it "invokes onLoad callback", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("/fixtures/sinon.html", {
        onLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "invokes onBeforeLoad callback with cy context", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("/fixtures/sinon.html", {
        onBeforeLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "does not error without an onBeforeLoad callback", ->
      @cy.visit("/fixtures/sinon.html").then ->
        prev = @cy.state("current").get("prev")
        expect(prev.get("args")).to.have.length(1)

    it "calls resolve:url with http:// when localhost", ->
      trigger = @sandbox.spy(@Cypress, "trigger")

      @cy
        .visit("localhost:3500/app")
        .then ->
          expect(trigger).to.be.calledWith("resolve:url", "http://localhost:3500/app")

    it "prepends hostname when visiting locally", ->
      prop = @sandbox.spy(@cy.privateState("$remoteIframe"), "prop")

      @cy
        .visit("fixtures/sinon.html")
        .then ->
          expect(prop).to.be.calledWith("src", "http://localhost:3500/fixtures/sinon.html")

    it "does not set initial ever", ->
      setInitial = @sandbox.spy(@Cypress.Cookies, "setInitial")

      ## do not fire any beforeunload listeners
      ## else setInitial will trigger twice
      @cy.offWindowListeners()

      @cy
        .visit("/foo")
        .then ->
          expect(setInitial).not.to.be.called

    it "can visit pages on the same originPolicy", ->
      @cy
        .visit("http://localhost:3500/blank.html")
        .visit("http://localhost:3500/blank.html")
        .visit("http://localhost:3500/blank.html")

    it "can visit pages on different subdomain but same originPolicy", ->
      $remoteIframe = @cy.privateState("$remoteIframe")

      load = ->
        $remoteIframe.trigger("load")

      ## whenever we're told to change the src
      ## just fire the load event directly on the $remoteIframe
      @sandbox.stub(@cy, "_src", load)

      ## make it seem like we're already on www.foobar.com:3500
      one = @Cypress.Location.create("http://www.foobar.com:3500/blank.html")
      two = @Cypress.Location.create("http://help.foobar.com:3500/blank.html")

      @sandbox.stub(@cy, "_existing")
      .onCall(0).returns(one)
      .onCall(1).returns(two)

      trigger = @sandbox.spy(@Cypress, "trigger")

      @cy
        .visit("http://www.foobar.com:3500/blank.html")
        .visit("http://help.foobar.com:3500/blank.html")
        .then ->
          ## we should never have to go across domains even though
          ## we're visiting a subdomain
          expect(trigger).not.to.be.calledWith("preserve:run:state")

    it "can visit relative pages on the same originPolicy", ->
      ## as long as we are already on the localhost:3500
      ## domain this will work

      @cy
        .visit("http://localhost:3500/foo")
        .visit("/foo")

    it "can visit relative pages with domain like query params", ->
      @cy
        .visit("http://localhost:3500/bar")
        .visit("http://localhost:3500/foo?email=brian@cypress.io")

    describe "when only hashes are changing", ->
      it "short circuits the visit if the page will not refresh", ->
        count = 0
        urls = []

        @cy.privateState("$remoteIframe").on "load", =>
          urls.push @cy.privateState("window").location.href

          count += 1

        @cy
          ## about:blank yes (1)
          .visit("/hash.html?foo#bar") ## yes (2)
          .visit("/hash.html?foo#foo") ## no (2)
          .visit("/hash.html?bar#bar") ## yes (3)
          .visit("/blank.html?bar#bar") ## yes (4)
          .visit("/blank.html?baz#bar") ## yes (5)
          .visit("/blank.html#bar") ## yes (6)
          .visit("/blank.html") ## yes (7)
          .visit("/blank.html#baz") ## no (7)
          .visit("/blank.html#") ## no (7)
          .then ->
            expect(count).to.eq(7)
            expect(urls).to.deep.eq([
              "about:blank"
              "http://localhost:3500/hash.html?foo#bar"
              "http://localhost:3500/hash.html?bar#bar"
              "http://localhost:3500/blank.html?bar#bar"
              "http://localhost:3500/blank.html?baz#bar"
              "http://localhost:3500/blank.html#bar"
              "http://localhost:3500/blank.html"
            ])

    describe "when origins don't match", ->
      beforeEach ->
        @Cypress.trigger "test:before:run", {id: 888}

        @sandbox.stub(@Cypress, "getEmissions").returns([])
        @sandbox.stub(@Cypress, "getTestsState").returns([])
        @sandbox.stub(@Cypress, "getStartTime").returns("12345")
        @sandbox.stub(@Cypress.Log, "countLogsByTests").withArgs([]).returns(1)
        @sandbox.stub(@Cypress, "countByTestState")
          .withArgs([], "passed").returns(2)
          .withArgs([], "failed").returns(3)
          .withArgs([], "pending").returns(4)

      it "triggers preserve:run:state with title + fn", (done) ->
        @Cypress.on "preserve:run:state", (state, cb) ->
          expect(state).to.deep.eq({
            currentId: 888
            tests: []
            emissions: []
            startTime: "12345"
            numLogs: 1
            passed: 2
            failed: 3
            pending: 4
          })
          done()

        @cy.visit("http://localhost:4200")

      it "replaces window.location when origins don't match", (done) ->
        href = window.location.href

        @Cypress.on "preserve:run:state", (state, cb) ->
          cb()

        @sandbox.stub(@cy, "_getLocation").withArgs("href").returns("about:blank")

        current = @Cypress.Location.create("about:blank")
        remote  = @Cypress.Location.create("http://localhost:4200")
        uri     = @Cypress.Location.create("http://localhost:3500/foo?bar=baz#/tests/integration/foo_spec.js")

        @sandbox.stub(@Cypress.Location, "create")
        .withArgs("about:blank")
        .returns(current)
        .withArgs(href)
        .returns(uri)
        .withArgs("http://localhost:4200")
        .returns(remote)
        .withArgs("http://localhost:4200/")
        .returns(remote)

        _href = @cy._href
        count = 0

        @cy._href = (win, url) ->
          count += 1

          if count is 1
            _href.apply(@, arguments)
          else
            expect(win).to.eq(window)
            expect(url).to.eq("http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js")
            done()

        @cy.visit("http://localhost:4200")

    describe "location getter overrides", ->
      beforeEach ->
        @eq = (attr, str) =>
          expect(@win.location[attr]).to.eq str

        @cy
          .visit("/fixtures/sinon.html?foo=bar#dashboard?baz=quux")
          .window().as("win").then (win) ->
            ## ensure href always returns the full path
            ## so our tests guarantee that in fact we are
            ## overriding the location getters
            expect(win.location.href).to.include "fixtures/sinon.html?foo=bar#dashboard?baz=quux"

      it "hash", ->
        @eq "hash", "#dashboard?baz=quux"

      it "hostname", ->
        @eq "hostname", "localhost"

      it "origin", ->
        @eq "origin", "http://localhost:3500"

      it "pathname", ->
        @eq "pathname", "/fixtures/sinon.html"

      it "port", ->
        @eq "port", "3500"

      it "protocol", ->
        @eq "protocol", "http:"

      it "search", ->
        @eq "search", "?foo=bar"

    describe "history method overrides", ->
      beforeEach ->
        @cy
          .visit("/fixtures/sinon.html")
          .window().as("win")
          .then ->
            @urlChanged = @sandbox.spy @cy, "urlChanged"

      _.each ["back", "forward", "go"], (attr) =>
        it "fires 'history:event' on attr: '#{attr}'", ->
          if attr is "go"
            arg = -1

          @win.history[attr](arg)
          expect(@urlChanged).to.be.called
          Promise.delay(300)

      _.each ["pushState", "replaceState"], (attr) =>
        it "fires 'history:event' on attr: '#{attr}'", ->
          @win.history[attr]({}, "foo")
          expect(@urlChanged).to.be.called
          Promise.delay(300)

    describe ".log", ->
      beforeEach ->
        @sandbox.stub(@Cypress, "getEmissions").returns([])
        @Cypress.on "log", (attrs, @log) =>

      it "preserves url on subsequent visits", ->
        @cy.visit("/fixtures/sinon.html").get("button").then ->
          expect(@log.get("url")).to.eq "http://localhost:3500/fixtures/sinon.html"

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.pick("name", "message")).to.deep.eq {
            name: "visit"
            message: "localhost:3500/app/foo#/hash"
          }

          done()

        @cy.visit("localhost:3500/app/foo#/hash")

      it "logs obj once complete", ->
        @cy.visit("http://localhost:3500/blank.html").then ->
          obj = {
            state: "passed"
            name: "visit"
            message: "http://localhost:3500/blank.html"
            url: "http://localhost:3500/blank.html"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "snapshots once", ->
        @cy.visit("/blank.html").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "can turn off logging", ->
        log = null

        @Cypress.on "log", (attrs, l) ->
          log = l

        @cy.visit("/timeout?ms=0", {log: false}).then ->
          expect(log).to.be.null

      it "displays file attributes as consoleProps", ->
        @sandbox.stub(@cy, "_resolveUrl").resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          filePath: "/path/to/foo/bar"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        @cy.visit("/foo").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq({
            "Command": "visit"
            "File Served": "/path/to/foo/bar"
            "Resolved Url": "http://localhost:3500/foo/bar"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "displays http attributes as consoleProps", ->
        @sandbox.stub(@cy, "_resolveUrl").resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        @cy.visit("http://localhost:3500/foo").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq({
            "Command": "visit"
            "Resolved Url": "http://localhost:3500/foo"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "displays originalUrl http attributes as consoleProps", ->
        @sandbox.stub(@cy, "_resolveUrl").resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        @cy.visit("http://localhost:3500/foo").then ->
          expect(@log.attributes.consoleProps()).to.deep.eq({
            "Command": "visit"
            "Original Url": "http://localhost:3500/foo"
            "Resolved Url": "http://localhost:3500/foo/bar"
            "Redirects": [1, 2]
            "Cookies Set": [{}, {}]
          })

      it "indicates redirects in the message", ->
        @sandbox.stub(@cy, "_resolveUrl").resolves({
          isOkStatusCode: true
          isHtml: true
          contentType: "text/html"
          url: "http://localhost:3500/foo/bar"
          originalUrl: "http://localhost:3500/foo"
          redirects: [1, 2]
          cookies: [{}, {}]
        })

        @cy.visit("http://localhost:3500/foo").then ->
          expect(@log.get("message")).to.eq(
            "http://localhost:3500/foo -> 1 -> 2"
          )

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "sets error command state", (done) ->
        @sandbox.stub(@cy, "_resolveUrl").rejects(new Error)

        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "failed"
          expect(@log.get("error")).to.eq err
          done()

        @cy.visit("/blank.html")

      it "logs once on error", (done) ->
        @sandbox.stub(@cy, "_resolveUrl").rejects(new Error)

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.on "fail", (err) ->
          expect(logs).to.have.length(1)
          done()

        @cy.visit("/blank.html")

      it "logs once on timeout error", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(err.message).to.include "Your page did not fire its 'load' event within '200ms'."
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("/timeout?ms=5000", {timeout: 200})

      it "cancels resolve url promise on timeout", (done) ->
        Cypress.on "collect:run:state", ->
          done(new Error("should not have tried to swap domains"))

        r = @sandbox.spy(@cy, "_resolveUrl")

        Cypress.off("resolve:url")

        Cypress.on "resolve:url", (args, cb) ->
          ## resolve after 150ms
          Promise.delay(150)
          .then ->
            cb({isOkStatusCode: true, isHtml: true, url: "http://some.new-domain.com"})
          .then ->
            p = r.getCall(0).returnValue

            ## make sure our _resolveUrl promise
            ## has been rejected via TimeoutError
            expect(p.isRejected()).to.be.true

            done()

        @cy.visit("/", {timeout: 100})

      it "throws when url isnt a string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.visit() must be called with a string as its 1st argument"
          done()

        @cy.visit()

      it "unbinds remoteIframe load event"

      it "throws when attempting to visit a 2nd domain on different port", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500/blank.html")
          .visit("http://localhost:3501/blank.html")

      it "throws when attempting to visit a 2nd domain on different protocol", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500/blank.html")
          .visit("https://localhost:3500/blank.html")

      it "throws when attempting to visit a 2nd domain on different host", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500/blank.html")
          .visit("http://google.com:3500/blank.html")

      it "throws attemping to visit 2 unique ip addresses", (done) ->
        $remoteIframe = @cy.privateState("$remoteIframe")

        load = ->
          $remoteIframe.trigger("load")

        ## whenever we're told to change the src
        ## just fire the load event directly on the $remoteIframe
        @sandbox.stub(@cy, "_src", load)

        logs = []

        ## make it seem like we're already on http://127.0.0.1:3500
        one = @Cypress.Location.create("http://127.0.0.1:3500/blank.html")
        @sandbox.stub(@cy, "_existing")
        .returns(one)

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cy.visit() failed because you are attempting to visit a second unique domain.")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://127.0.0.1:3500/blank.html")
          .visit("http://126.0.0.1:3500/blank.html")

      it "does not call resolve:url when throws attemping to visit a 2nd domain", (done) ->
        trigger = @sandbox.spy(@Cypress, "trigger")

        @cy.on "fail", (err) =>
          expect(trigger).to.be.calledWithMatch("resolve:url", "http://localhost:3500/blank.html")
          expect(trigger).not.to.be.calledWithMatch("resolve:url", "http://google.com:3500/blank.html")
          done()

        @cy
          .visit("http://localhost:3500/blank.html")
          .visit("http://google.com:3500/blank.html")

      it "displays loading_network_failed when _resolveUrl throws", (done) ->
        err1 = new Error("connect ECONNREFUSED 127.0.0.1:64646")
        err1.stack = "some stack props"

        @sandbox.stub(@cy, "_resolveUrl").rejects(err1)
        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            /foo.html

            We attempted to make an http request to this URL but the request failed without a response.

            We received this error at the network level:

              > Error: connect ECONNREFUSED 127.0.0.1:64646

            Common situations why this would fail:
              - you don't have internet access
              - you forgot to run / boot your web server
              - your web server isn't accessible
              - you have weird network configuration settings on your computer

            The stack trace for this error is:

            some stack props
          """)
          expect(err1.url).to.include("/foo.html")
          expect(trigger).to.be.calledWith("visit:failed", err1)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("/foo.html")

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

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "/foo.html").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            /foo.html

            We failed looking for this file at the path:

            /path/to/foo.html

            The internal Cypress web server responded with:

              > 404: Not Found
          """)
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("/foo.html")

      ## FIXME: the following 5 tests hang when running all tests in this file

      it.skip "displays loading_file_failed redirects when _resolveUrl resp is not ok", (done) ->
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

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "/bar").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
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
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("/bar")

      it.skip "displays loading_http_failed when _resolveUrl resp is not ok", (done) ->
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

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "https://google.com/foo").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 500: Server Error

            This was considered a failure because the status code was not '2xx'.
          """)
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("https://google.com/foo")

      it.skip "displays loading_http_failed redirects when _resolveUrl resp is not ok", (done) ->
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

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "https://google.com/foo").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The response we received from your web server was:

              > 401: Unauthorized

            This was considered a failure because the status code was not '2xx'.

            This http request was redirected '2' times to:

              - 302: https://google.com/bar/
              - 301: https://gmail.com/
          """)
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("https://google.com/foo")

      it.skip "displays loading_invalid_content_type when isHtml is false on http requests", (done) ->
        obj = {
          isOkStatusCode: true
          isHtml: false
          contentType: "application/json"
          originalUrl: "https://google.com/foo"
          status: 200
          statusText: "OK"
        }

        visitErrObj = _.clone(obj)
        obj.url = obj.originalUrl

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "https://google.com/foo").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The content-type of the response we received from your web server was:

              > application/json

            This was considered a failure because responses must have content-type: 'text/html'

            However, you can likely use cy.request() instead of cy.visit().

            cy.request() will automatically get and set cookies and enable you to parse responses.
          """)
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("https://google.com/foo")

      it.skip "displays loading_invalid_content_type when isHtml is false on file requests", (done) ->
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

        @sandbox.stub(@Cypress, "triggerPromise").withArgs("resolve:url", "https://google.com/foo").resolves(obj)

        trigger = @sandbox.spy(@Cypress, "trigger")

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("""
            cy.visit() failed trying to load:

            https://google.com/foo

            The content-type of the response we received from this local file was:

              > application/json

            This was considered a failure because responses must have content-type: 'text/html'

            However, you can likely use cy.request() instead of cy.visit().

            cy.request() will automatically get and set cookies and enable you to parse responses.
          """)
          expect(trigger).to.be.calledWithMatch("visit:failed", obj)
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("https://google.com/foo")

  context "#loading", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = @sandbox.spy Promise.prototype, "timeout"
      @Cypress.config("pageLoadTimeout", 1500)
      @cy.visit("/foo").then ->
        expect(timeout).to.be.calledWith(1500)

    it "does not reset the timeout", (done) ->
      @cy._timeout(1000)

      ## previously loading would reset the timeout
      ## which could cause failures on the next test
      ## if there was logic after a test finished running
      @cy.window().then (win) =>
        timeout = @sandbox.spy(@cy, "_timeout")

        @cy.privateState("$remoteIframe").one "load", =>
          @cy.state("ready").promise.then ->
            _.delay ->
              expect(timeout.callCount).to.eq(1)
              expect(timeout.firstCall).to.be.calledWith(1000)
              done()
            , 50

        win.location.href = "about:blank"

    it "sets initial=true on beforeunload", ->
      Cookies.remove("__cypress.initial")

      expect(Cookies.get("__cypress.initial")).to.be.undefined

      ## this navigates us to a new page so
      ## we should be setting the initial cookie
      @cy.get("a:first").click().then ->
        expect(Cookies.get("__cypress.initial")).to.eq("true")

    it "clears current cy subject", ->
      input = @cy.$$("form#click-me input[type=submit]")

      @cy.get("form#click-me").find("input[type=submit]").click().then (subject) ->
        expect(@cy.queue.names()).to.deep.eq [
          "get", "find", "click", "then", "then"
        ]
        expect(getFirstSubjectByName("click").get(0)).to.eq input.get(0)
        expect(subject).to.be.undefined

    it "clears the current subject on submit event as well", ->
      form = @cy.$$("form#click-me")

      @cy.get("form#click-me").submit().then (subject) ->
        expect(@cy.queue.names()).to.deep.eq [
          "get", "submit", "then", "then"
        ]
        expect(getFirstSubjectByName("get").get(0)).to.eq form.get(0)
        expect(subject).to.be.undefined

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "returns if current command is visit", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.visit("/fixtures/xhr.html").then ->
          expect(logs).to.have.length(1)

      it "is name: page load", ->
        @cy.get("form#click-me").find("input[type=submit]").click().then ->
          expect(@log.get("name")).to.eq "page load"

      it "is type: parent", ->
        @cy.get("form#click-me").submit().then ->
          expect(@log.get("type")).to.eq "parent"

      describe "#consoleProps", ->
        it "only has Event: 'page load'", ->
          @cy.get("form#click-me").submit().then ->
            expect(@log.attributes.consoleProps()).to.deep.eq {
              Event: "page load"
              Notes: "This page event automatically nulls the current subject. This prevents chaining off of DOM objects which existed on the previous page."
            }

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "can time out", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.once "fail", (err) ->
          ## should only log once
          expect(logs.length).to.eq 1
          expect(err.message).to.include "Your page did not fire its 'load' event within '100ms'."
          done()

        @cy.on "invoke:end", =>
          @cy.isReady(false, "testing")
          @cy.loading({timeout: 100})

        @cy.noop({})

      it "captures cross origin failures", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.once "fail", (err) ->
          log = logs[0]

          expect(err.message).to.include("Cypress detected a cross origin error happened on page load")
          expect(logs.length).to.eq(1)
          expect(log.get("name")).to.eq("page load")
          expect(log.get("state")).to.eq("failed")
          expect(log.get("error")).to.eq(err)
          done()

        @cy
          .window({log: false}).then (win) ->
            win.location.href = "http://localhost:3501/fixtures/dom.html"

            null
          .wait(2000)
