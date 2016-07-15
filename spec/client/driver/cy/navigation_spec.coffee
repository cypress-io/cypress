describe "$Cypress.Cy Navigation Commands", ->
  enterCommandTestingMode()

  context "#reload", ->
    it "calls into window.location.reload", (done) ->
      fn = (arg) ->
        expect(arg).to.be.false
        done()

      win = {location: {reload: fn}}

      @cy.private("window", win)

      @cy.reload()

    it "can pass forceReload", (done) ->
      fn = (arg) ->
        expect(arg).to.be.true
        done()

      win = {location: {reload: fn}}

      @cy.private("window", win)

      @cy.reload(true)

    it "can pass forceReload + options", (done) ->
      fn = (arg) ->
        expect(arg).to.be.true
        done()

      win = {location: {reload: fn}}

      @cy.private("window", win)

      @cy.reload(true, {})

    it "can pass just options", (done) ->
      fn = (arg) ->
        expect(arg).to.be.false
        done()

      win = {location: {reload: fn}}

      @cy.private("window", win)

      @cy.reload({})

    it "returns the window object", ->
      @cy
        .window().then (oldWin) ->
          oldWin.foo = "bar"
          expect(oldWin.foo).to.eq("bar")

          cy.reload().then (win) ->
            expect(win).not.to.be.undefined
            expect(win.foo).to.be.undefined

            expect(win).to.eq(@cy.private("window"))

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
          expect(err.message).to.eq "Timed out after waiting '1ms' for your remote page to load."
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
              expect(@log.get("snapshots")[0].state).to.be.an("object")
              return undefined

          .reload().then ->
            expect(beforeunload).to.be.true
            expect(@log.get("snapshots").length).to.eq(2)
            expect(@log.get("snapshots")[1].name).to.eq("after")
            expect(@log.get("snapshots")[1].state).to.be.an("object")
            done()

  context "#go", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      @cy
        .visit("http://localhost:3500/fixtures/html/sinon.html")
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
          expect(err.message).to.eq "Timed out after waiting '1ms' for your remote page to load."
          done()

        @cy
          .visit("http://localhost:3500/fixtures/html/sinon.html")
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
          .visit("http://localhost:3500/foo")
          .go("back", {timeout: 1})

    describe ".log", ->

  context "#visit", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = @sandbox.spy Promise.prototype, "timeout"
      @Cypress.config("pageLoadTimeout", 1500)
      @cy.visit("http://localhost:3500/foo").then ->
        expect(timeout).to.be.calledWith(1500)

    it "resolves the subject to the remote iframe window", ->
      @cy.visit("http://localhost:3500/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      @cy.visit("http://localhost:3500/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "http://localhost:3500/foo"

    it "rejects the promise if data-cypress-visit-error is in the body"

    it "rejects with error: ...something..."

    it "extends the runnables timeout before visit"

    it "resets the runnables timeout after visit"

    it "invokes onLoad callback", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("http://localhost:3500/fixtures/html/sinon.html", {
        onLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "invokes onBeforeLoad callback with cy context", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("http://localhost:3500/fixtures/html/sinon.html", {
        onBeforeLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "does not error without an onBeforeLoad callback", ->
      @cy.visit("http://localhost:3500/fixtures/html/sinon.html").then ->
        prev = @cy.prop("current").get("prev")
        expect(prev.get("args")).to.have.length(1)

    it "first navigates to about:blank if existing url isnt about:blank", ->
      @cy
        .window().as("win")
        .visit("http://localhost:3500/timeout?ms=0").then ->
          @_href = @sandbox.spy @cy, "_href"
        .visit("http://localhost:3500/timeout?ms=1").then ->
          expect(@_href).to.be.calledWith @win, "about:blank"

    it "does not navigate to about:blank if existing url is about:blank", ->
      @sandbox.stub(@cy, "_getLocation").returns("about:blank")
      _href = @sandbox.spy @cy, "_href"

      @cy
        .visit("http://localhost:3500/timeout?ms=0").then ->
          expect(_href).not.to.be.called

    it "calls set:domain with http:// when localhost", ->
      trigger = @sandbox.spy(@Cypress, "trigger")

      @cy
        .visit("localhost:3500/app")
        .then ->
          expect(trigger).to.be.calledWith("set:domain", "http://localhost:3500/app")

    it "prepends with / when visiting locally", ->
      prop = @sandbox.spy(@cy.private("$remoteIframe"), "prop")

      @cy
        .visit("fixtures/html/sinon.html")
        .then ->
          expect(prop).to.be.calledWith("src", "/fixtures/html/sinon.html")

    it "sets initial when not needing to change domains", ->
      setInitial = @sandbox.spy(@Cypress.Cookies, "setInitial")

      ## do not fire any beforeunload listeners
      ## else setInitial will trigger twice
      @cy.offWindowListeners()

      @cy
        .visit("/foo")
        .then ->
          expect(setInitial).to.be.calledOnce

    it "can visit pages on the same originPolicy", ->
      @cy
        .visit("http://localhost:3500")
        .visit("http://localhost:3500")
        .visit("http://localhost:3500")

    it "can visit relative pages on the same originPolicy", ->
      ## as long as we are already on the localhost:3500
      ## domain this will work

      @cy
        .visit("http://localhost:3500/foo")
        .visit("/foo")

    describe "when origins don't match", ->
      beforeEach ->
        @Cypress.trigger "test:before:run", {id: 888}

        @sandbox.stub(@cy, "_replace")
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
            startTime: "12345"
            scrollTop: null
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

        remote = @Cypress.Location.create("http://localhost:4200")
        uri    = @Cypress.Location.create("http://localhost:3500/foo?bar=baz#/tests/integration/foo_spec.js")

        @sandbox.stub(@Cypress.Location, "create")
        .withArgs(href)
        .returns(uri)
        .withArgs("http://localhost:4200")
        .returns(remote)
        .withArgs("http://localhost:4200/")
        .returns(remote)

        @cy._replace = (win, url) ->
          expect(win).to.eq(window)
          expect(url).to.eq("http://localhost:4200/foo?bar=baz#/tests/integration/foo_spec.js")
          done()

        @cy.visit("http://localhost:4200")

    describe "location getter overrides", ->
      beforeEach ->
        @eq = (attr, str) =>
          expect(@win.location[attr]).to.eq str

        @cy
          .visit("http://localhost:3500/fixtures/html/sinon.html?foo=bar#dashboard?baz=quux")
          .window().as("win").then (win) ->
            ## ensure href always returns the full path
            ## so our tests guarantee that in fact we are
            ## overriding the location getters
            expect(win.location.href).to.include "fixtures/html/sinon.html?foo=bar#dashboard?baz=quux"

      it "hash", ->
        @eq "hash", "#dashboard?baz=quux"

      it "hostname", ->
        @eq "hostname", "localhost"

      it "origin", ->
        @eq "origin", "http://localhost:3500"

      it "pathname", ->
        @eq "pathname", "/fixtures/html/sinon.html"

      it "port", ->
        @eq "port", "3500"

      it "protocol", ->
        @eq "protocol", "http:"

      it "search", ->
        @eq "search", "?foo=bar"

    describe "history method overrides", ->
      beforeEach ->
        @cy
          .visit("http://localhost:3500/fixtures/html/sinon.html")
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
        @Cypress.on "log", (attrs, @log) =>

      it "preserves url on subsequent visits", ->
        @cy.visit("http://localhost:3500/fixtures/html/sinon.html").get("button").then ->
          expect(@log.get("url")).to.eq "http://localhost:3500/fixtures/html/sinon.html"

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (attrs, log) ->
          expect(log.pick("name", "message")).to.deep.eq {
            name: "visit"
            message: "localhost:4200/app/foo#/hash"
          }

          done()

        @cy.visit("localhost:4200/app/foo#/hash")

      it "logs obj once complete", ->
        @cy.visit("http://localhost:3500/index.html").then ->
          obj = {
            state: "passed"
            name: "visit"
            message: "http://localhost:3500/index.html"
            url: "http://localhost:3500/index.html"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "can turn off logging", ->
        log = null

        @Cypress.on "log", (attrs, l) ->
          log = l

        @cy.visit("http://localhost:3500/timeout?ms=0", {log: false}).then ->
          expect(log).to.be.null

    describe "errors", ->
      beforeEach ->
        @allowErrors()

        @failVisit = =>
          cy$ = @cy.$$

          ## act as if we have this node
          error = @sandbox.stub @cy, "$$", (selector) ->
            if selector is "[data-cypress-visit-error]"
              error.restore()
              return {length: 1}
            else
              cy$.apply(@, arguments)

      it "sets error command state", (done) ->
        @Cypress.on "log", (attrs, @log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "failed"
          expect(@log.get("error")).to.eq err
          done()

        @failVisit()

        @cy.visit("http://localhost:3500/index.html")

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @failVisit()

        @cy.on "fail", (err) ->
          expect(logs).to.have.length(1)
          done()

        @cy.visit("http://localhost:3500/index.html")

      it "throws when url isnt a string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.visit() must be called with a string as its 1st argument"
          done()

        @cy.visit()

      it "throws when visit times out", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Timed out after waiting '500ms' for your remote page to load."
          done()

        @cy.visit("http://localhost:3500/timeout?ms=5000", {timeout: 500})

      it "unbinds remoteIframe load event"

      it "only logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("http://localhost:3500/timeout?ms=5000", {timeout: 500})

      it "throws when attempting to visit a 2nd domain on different port", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cannot visit a 2nd unique domain")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500")
          .visit("http://localhost:3501")

      it "throws when attempting to visit a 2nd domain on different protocol", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cannot visit a 2nd unique domain")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500")
          .visit("https://localhost:3500")

      it "throws when attempting to visit a 2nd domain on different host", (done) ->
        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cannot visit a 2nd unique domain")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          .visit("http://localhost:3500")
          .visit("http://google.com:3500")

      it "throws attemping to visit 2 unique ip addresses", (done) ->
        logs = []

        ## make it seem like we're already on http://127.0.0.1:3500
        one = @Cypress.Location.create("http://127.0.0.1:3500")
        two = @Cypress.Location.create("http://126.0.0.1:3500")

        @sandbox.stub(Cypress.Location, "createInitialRemoteSrc")
        .withArgs("http://127.0.0.1:3500/")
        .returns("http://localhost:3500/foo")
        .withArgs("http://127.0.0.1:3500/")
        .returns("http://localhost:3500/foo")

        @sandbox.stub(@Cypress.Location, "create")
        .withArgs(window.location.href)
        .returns(one)
        .withArgs("http://127.0.0.1:3500")
        .returns(one)
        .withArgs("http://127.0.0.1:3500/")
        .returns(one)
        .withArgs("http://126.0.0.1:3500")
        .returns(two)
        .withArgs("http://126.0.0.1:3500/")
        .returns(two)

        @sandbox.stub(@cy, "_getLocation").withArgs("href").returns("about:blank")

        @Cypress.on "log", (attrs, @log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(err.message).to.include("cannot visit a 2nd unique domain")
          expect(logs.length).to.eq(2)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy
          ## we just mock the visits so ignore what
          ## is here
          .visit("http://127.0.0.1:3500")
          .visit("http://126.0.0.1:3500")

      it "does not call set:domain when throws attemping to visit a 2nd domain", (done) ->
        trigger = @sandbox.spy(@Cypress, "trigger")

        @cy.on "fail", (err) =>
          expect(trigger).to.be.calledWithMatch("set:domain", "http://localhost:3500")
          expect(trigger).not.to.be.calledWithMatch("set:domain", "http://google.com:3500")
          done()

        @cy
          .visit("http://localhost:3500")
          .visit("http://google.com:3500")

  context "#loading", ->
    it "sets timeout to Cypress.config(pageLoadTimeout)", ->
      timeout = @sandbox.spy Promise.prototype, "timeout"
      @Cypress.config("pageLoadTimeout", 1500)
      @cy.visit("http://localhost:3500/foo").then ->
        expect(timeout).to.be.calledWith(1500)

    it "does not reset the timeout", (done) ->
      @cy._timeout(1000)

      ## previously loading would reset the timeout
      ## which could cause failures on the next test
      ## if there was logic after a test finished running
      @cy.window().then (win) =>
        timeout = @sandbox.spy(@cy, "_timeout")

        @cy.private("$remoteIframe").one "load", =>
          @cy.prop("ready").promise.then ->
            _.delay ->
              expect(timeout.callCount).to.eq(1)
              expect(timeout.firstCall).to.be.calledWith(1000)
              done()
            , 50

        win.location.href = "about:blank"

    it "clears current cy subject", ->
      input = @cy.$$("form#click-me input[type=submit]")

      @cy.get("form#click-me").find("input[type=submit]").click().then (subject) ->
        expect(@cy.commands.names()).to.deep.eq [
          "get", "find", "click", "then", "then"
        ]
        expect(getFirstSubjectByName("click").get(0)).to.eq input.get(0)
        expect(subject).to.be.null

    it "clears the current subject on submit event as well", ->
      form = @cy.$$("form#click-me")

      @cy.get("form#click-me").submit().then (subject) ->
        expect(@cy.commands.names()).to.deep.eq [
          "get", "submit", "then", "then"
        ]
        expect(getFirstSubjectByName("get").get(0)).to.eq form.get(0)
        expect(subject).to.be.null

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "returns if current command is visit", ->
        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.visit("http://localhost:3500/fixtures/html/xhr.html").then ->
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
          expect(err.message).to.eq "Timed out after waiting '100ms' for your remote page to load."
          done()

        @cy.on "invoke:end", =>
          @cy.isReady(false, "testing")
          @cy.loading({timeout: 100})

        @cy.noop({})

      ## this goes through the same process as visit
      ## where it errors if cypress sent back an error
      it "errors if [cypress-error] was found", (done) ->
        cy$ = @cy.$$

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        @cy.on "fail", (err) ->
          ## should only log once
          expect(logs.length).to.eq 1
          expect(err.message).to.eq "Loading the new page failed."
          done()

        ## act as if we have this node
        error = @sandbox.stub @cy, "$$", (selector) ->
          if selector is "[data-cypress-visit-error]"
            error.restore()
            return {length: 1}
          else
            cy$.apply(@, arguments)

        @cy.on "invoke:end", =>
          @cy.isReady(false, "testing")
          @cy.loading()
          @cy.isReady()

        @cy.noop({})
