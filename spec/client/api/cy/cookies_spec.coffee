describe "$Cypress.Cy Cookie Commands", ->
  enterCommandTestingMode()

  context "#clearCookie", ->
    beforeEach ->
      $Cypress.Cookies.setInitial()
      Cookies.set("foo", "bar", {path: "/"})
      Cookies.set("bar", "quux", {path: "/"})

    afterEach ->
      _.each Cookies.get(), (value, key) ->
        Cookies.remove key, {path: "/"}

    it "is defined", ->
      expect(@cy.clearCookies).to.be.defined

    describe "path", ->
      it "can clear cookie set with path", ->
        cy
          .document().then (doc) ->
            doc.cookie = "asdf=jkl"
          .clearCookie("asdf")
          .document().its("cookie").should("not.include", "asdf")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "key must be a string", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "cy.clearCookie must be passed a string argument"
          done()

        @cy.clearCookie()

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "ends immediately", ->
        @cy.clearCookie("foo").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearCookie("foo").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "#onConsole", ->
        @cy.clearCookie("foo").then (cookies) ->
          c = @log.attributes.onConsole().cookies
          expect(c).to.eq cookies
          expect(c).to.deep.eq {bar: "quux"}

  context "#clearCookies", ->
    it "is defined", ->
      expect(@cy.clearCookies).to.be.defined

    it "sets the subject to the returned cookies", ->
      @cy.clearCookies().then (cookies) ->
        expect(cookies).to.deep.eq {}

    describe "test:before:hooks", ->
      it "clears cookies before each test run", ->
        clearCookies = @sandbox.spy $Cypress.Cookies, "clearCookies"
        @Cypress.trigger "test:before:hooks"
        expect(clearCookies).to.be.calledOnce
        expect(clearCookies.getCall(0).args).to.deep.eq [undefined]

    describe "path", ->
      it "can clear cookies set with path", ->
        cy
          .document().then (doc) ->
            doc.cookie = "foo=bar"
          .clearCookies()
          .document().its("cookie").should("not.include", "foo")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "ends immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "#onConsole", ->
        @cy.clearCookies().then (cookies) ->
          c = @log.attributes.onConsole().cookies
          expect(c).to.eq cookies
          expect(c).to.deep.eq {}

  context "#getCookies", ->
    beforeEach ->
      @cy.clearCookies()

    afterEach ->
      @cy.clearCookies()

    it "sets the subject to the returned cookies", ->
      @cy.getCookies().then (cookies) ->
        expect(cookies).to.deep.eq {}

    describe "path", ->
      it "can get cookies set with path", ->
        Cypress.Cookies.set("baz", "quux")

        cy
          .document().then (doc) ->
            doc.cookie = "foo=bar"
          .getCookies().then (cookies) ->
            expect(cookies).to.deep.eq({
              foo: "bar"
              baz: "quux"
            })

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "ends immediately", ->
        @cy.getCookies().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.getCookies().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

      it "#onConsole", ->
        Cypress.Cookies.set("foo", "bar")

        @cy.getCookies().then (cookies) ->
          c = @log.attributes.onConsole().cookies
          expect(c).to.eq cookies
          expect(c).to.deep.eq {foo: "bar"}
