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
          expect(@log.get("snapshot")).to.be.an("object")

      it "#onConsole", ->
        @cy.clearCookie("foo").then (cookies) ->
          c = @log.attributes.onConsole().cookies
          expect(c).to.eq cookies
          expect(c).to.deep.eq {bar: "quux"}

  context "#clearCookies", ->
    it "is defined", ->
      expect(@cy.clearCookies).to.be.defined

    it "calls Cypress.Cookies.clearCookies", ->
      clearCookies = @sandbox.spy $Cypress.Cookies, "clearCookies"
      @cy.clearCookies().then ->
        expect(clearCookies).to.be.calledOnce

    it "sets the subject to the returned cookies", ->
      @cy.clearCookies().then (cookies) ->
        expect(cookies).to.deep.eq {}

    describe "test:before:hooks", ->
      it "clears cookies before each test run", ->
        clearCookies = @sandbox.spy $Cypress.Cookies, "clearCookies"
        @Cypress.trigger "test:before:hooks"
        expect(clearCookies).to.be.calledOnce
        expect(clearCookies.getCall(0).args).to.deep.eq [undefined]

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      it "ends immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.clearCookies().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "#onConsole", ->
        @cy.clearCookies().then (cookies) ->
          c = @log.attributes.onConsole().cookies
          expect(c).to.eq cookies
          expect(c).to.deep.eq {}
