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

        @Cypress.on "log", (log) ->
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
        @Cypress.on "log", (@log) =>

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
        .visit("fixtures/html/sinon.html")
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
          .visit("fixtures/html/sinon.html")
          .go("back", {timeout: 1})

      it "only logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (log) =>
          logs.push log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(3)
          expect(logs[1].get("error")).to.eq(err)
          done()

        @cy
          .visit("foo")
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
        expect(src).to.eq "/foo"

    it "rejects the promise if data-cypress-visit-error is in the body"

    it "rejects with error: ...something..."

    it "extends the runnables timeout before visit"

    it "resets the runnables timeout after visit"

    it "invokes onLoad callback", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("fixtures/html/sinon.html", {
        onLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "invokes onBeforeLoad callback with cy context", (done) ->
      cy = @cy

      ctx = @

      @cy.visit("fixtures/html/sinon.html", {
        onBeforeLoad: (contentWindow) ->
          expect(@).to.eq(ctx)
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "does not error without an onBeforeLoad callback", ->
      @cy.visit("fixtures/html/sinon.html").then ->
        prev = @cy.prop("current").get("prev")
        expect(prev.get("args")).to.have.length(1)

    it "first navigates to about:blank if existing url isnt about:blank", ->
      cy
        .window().as("win")
        .visit("timeout?ms=0").then ->
          @_href = @sandbox.spy @cy, "_href"
        .visit("timeout?ms=1").then ->
          expect(@_href).to.be.calledWith @win, "about:blank"

    it "does not navigate to about:blank if existing url is about:blank", ->
      @sandbox.stub(@cy, "_getLocation").returns("about:blank")
      _href = @sandbox.spy @cy, "_href"

      cy
        .visit("timeout?ms=0").then ->
          expect(_href).not.to.be.called

    describe "location getter overrides", ->
      beforeEach ->
        @eq = (attr, str) =>
          expect(@win.location[attr]).to.eq str

        @cy
          .visit("fixtures/html/sinon.html?foo=bar#dashboard?baz=quux")
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
          .visit("fixtures/html/sinon.html")
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
        @Cypress.on "log", (@log) =>

      it "preserves url on subsequent visits", ->
        @cy.visit("/fixtures/html/sinon.html").get("button").then ->
          expect(@log.get("url")).to.eq "/fixtures/html/sinon.html"

      it "logs immediately before resolving", (done) ->
        @Cypress.on "log", (log) ->
          expect(log.pick("name", "message")).to.deep.eq {
            name: "visit"
            message: "localhost:4200/app/foo#/hash"
          }

        @cy.visit("localhost:4200/app/foo#/hash").then -> done()

      it "logs obj once complete", ->
        @cy.visit("index.html").then ->
          obj = {
            state: "passed"
            name: "visit"
            message: "index.html"
            url: "index.html"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

      it "can turn off logging", ->
        log = null

        @Cypress.on "log", (l) ->
          log = l

        @cy.visit("timeout?ms=0", {log: false}).then ->
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
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "failed"
          expect(@log.get("error")).to.eq err
          done()

        @failVisit()

        @cy.visit("index.html")

      it "logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        @failVisit()

        @cy.on "fail", (err) ->
          expect(logs).to.have.length(1)
          done()

        @cy.visit("index.html")

      it "throws when url isnt a string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.visit() must be called with a string as its 1st argument"
          done()

        @cy.visit()

      it "throws when visit times out", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "Timed out after waiting '500ms' for your remote page to load."
          done()

        @cy.visit("timeout?ms=5000", {timeout: 500})

      it "unbinds remoteIframe load event"

      it "only logs once on error", (done) ->
        logs = []

        @Cypress.on "log", (@log) =>
          logs.push @log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          done()

        @cy.visit("timeout?ms=5000", {timeout: 500})

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
        @Cypress.on "log", (@log) =>

      it "returns if current command is visit", ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        @cy.visit("/fixtures/html/xhr.html").then ->
          expect(logs).to.have.length(1)

      it "is name: page load", ->
        @cy.get("form#click-me").find("input[type=submit]").click().then ->
          expect(@log.get("name")).to.eq "page load"

      it "is type: parent", ->
        @cy.get("form#click-me").submit().then ->
          expect(@log.get("type")).to.eq "parent"

      describe "#onConsole", ->
        it "only has Event: 'page load'", ->
          @cy.get("form#click-me").submit().then ->
            expect(@log.attributes.onConsole()).to.deep.eq {
              Event: "page load"
              Notes: "This page event automatically nulls the current subject. This prevents chaining off of DOM objects which existed on the previous page."
            }

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "can time out", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
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

        @Cypress.on "log", (log) ->
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
