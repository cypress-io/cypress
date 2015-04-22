describe "$Cypress.Cy Navigation Commands", ->
  enterCommandTestingMode()

  context "#visit", ->
    it "triggers visit:start on the remote iframe", (done) ->
      $("iframe").one "visit:start", (e, url) ->
        expect(url).to.eq "foo/"
        done()

      @cy.visit("/foo")

    it "resolves the subject to the remote iframe window", ->
      @cy.visit("/foo").then (win) ->
        expect(win).to.eq $("iframe").prop("contentWindow")

    it "changes the src of the iframe to the initial src", ->
      @cy.visit("/foo").then ->
        src = $("iframe").attr("src")
        expect(src).to.eq "/__remote/foo/?__initial=true"

    it "immediately updates the stored href on load", (done) ->
      _storeHref = @sandbox.spy @cy, "_storeHref"

      @cy.on "invoke:subject", (subject, obj) ->
        expect(_storeHref.callCount).to.eq 2
        done()

      @cy.visit("/foo")

    it "prevents _hrefChanged from always being true after visiting", (done) ->
      @cy.on "invoke:subject", (subject, obj) ->
        expect(@_hrefChanged()).to.be.false
        done()

      @cy.visit("/foo")

    it "rejects the promise if data-cypress-visit-error is in the body"

    it "rejects with error: ...something..."

    it "extends the runnables timeout before visit"

    it "resets the runnables timeout after visit"

    it "invokes onLoad callback"

    it "invokes onBeforeLoad callback", (done) ->
      @cy.visit("fixtures/html/sinon.html", {
        onBeforeLoad: (contentWindow) ->
          expect(contentWindow.sinon).to.be.defined
          done()
      })

    it "does not error without an onBeforeLoad callback", ->
      @cy.visit("fixtures/html/sinon.html").then ->
        prev = @cy.prop("current").prev
        expect(prev.args).to.have.length(1)

    describe "visit:start", ->
      beforeEach ->
        trigger = @sandbox.stub $.fn, "trigger"

        @baseUrl = (baseUrl) =>
          @sandbox.stub(@cy, "config").withArgs("baseUrl").returns(baseUrl)

        @urlIs = (source, destination) =>
          @cy.visit(source).then ->
            expect(trigger).to.be.calledWith "visit:start", destination

      it "index.html => index.html/", ->
        @urlIs "index.html", "index.html/"

      it "http://github.com => http://github.com/", ->
        @urlIs "http://github.com", "http://github.com/"

      it "http://localhost:4000/#/home", ->
        @urlIs "http://localhost:4000/#/home", "http://localhost:4000/#/home"

      it "home => http://localhost:3000/home/", ->
        @baseUrl "http://localhost:3000"

        @urlIs "home", "http://localhost:3000/home/"

      it "home => http://localhost:3000/#/home", ->
        @baseUrl "http://localhost:3000/#/"

        @urlIs "home", "http://localhost:3000/#/home"

      it "http://github.com/foo/bar#/home => http://github.com/foo/bar/#/home", ->
        @urlIs "http://github.com/foo/bar#/home", "http://github.com/foo/bar/#/home"

      it "foo/bar?baz=quux => http://0.0.0.0:8000/foo/bar/?baz=quux", ->
        @baseUrl "http://0.0.0.0:8000"

        @urlIs "foo/bar?baz=quux", "http://0.0.0.0:8000/foo/bar/?baz=quux"

      it "localhost:8000 => http://localhost:8000/", ->
        @urlIs "localhost:8000", "http://localhost:8000/"

      it "0.0.0.0:8000 => http://0.0.0.0:8000/", ->
        @urlIs "0.0.0.0:8000", "http://0.0.0.0:8000/"

      it "127.0.0.1:8000 => http://127.0.0.1:8000/", ->
        @urlIs "127.0.0.1:8000", "http://127.0.0.1:8000/"

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

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
            state: "success"
            name: "visit"
            message: "index.html"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).deep.eq(value, "expected key: #{key} to eq value: #{value}")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

        @failVisit = =>
          cy$ = @cy.$

          ## act as if we have this node
          error = @sandbox.stub @cy, "$", (selector) ->
            if selector is "[data-cypress-visit-error]"
              error.restore()
              return {length: 1}
            else
              cy$.apply(@, arguments)

      it "sets error command state", (done) ->
        @Cypress.on "log", (@log) =>

        @cy.on "fail", (err) =>
          expect(@log.get("state")).to.eq "error"
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
