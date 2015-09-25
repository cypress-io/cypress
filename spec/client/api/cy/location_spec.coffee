describe "$Cypress.Cy Location Commands", ->
  enterCommandTestingMode()

  context "#url", ->
    it "returns the location href", ->
      @cy.url().then (url) ->
        expect(url).to.eq "/fixtures/html/dom.html"

    it "eventually resolves", ->
      _.delay ->
        win = cy.private("window")
        win.location.href = "/foo/bar/baz.html"
      , 100

      @cy.url().should("match", /baz/).and("eq", "/foo/bar/baz.html")

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          win = cy.private("window")
          win.location.href = "/foo/bar/baz.html"

        @cy.url().should("match", /baz/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.url().should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.url().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.url().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.url().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        @cy.url().then ->
          obj = {
            name: "url"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        @cy.url({log: false}).then ->
          expect(@log).to.be.undefined

      it "#onConsole", ->
        @cy.url().then ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole).to.deep.eq {
            Command: "url"
            Returned: "/fixtures/html/dom.html"
          }

  context "#hash", ->
    it "returns the location hash", ->
      @cy.hash().then (hash) ->
        expect(hash).to.eq ""

    it "eventually resolves", ->
      _.delay ->
        win = cy.private("window")
        win.location.hash = "users/1"
      , 100

      @cy.hash().should("match", /users/).and("eq", "#users/1")

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          win = cy.private("window")
          win.location.hash = "users/1"

        @cy.hash().should("match", /users/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.hash().should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.hash().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.hash().then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.hash().then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "logs obj", ->
        @cy.hash().then ->
          obj = {
            name: "hash"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        @cy.hash({log: false}).then ->
          expect(@log).to.be.undefined

      it "#onConsole", ->
        @cy.hash().then ->
          onConsole = @log.attributes.onConsole()
          expect(onConsole).to.deep.eq {
            Command: "hash"
            Returned: ""
          }

  context "#location", ->
    it "returns the location object", ->
      @cy.location().then (loc) ->
        keys = _.keys loc
        expect(keys).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "toString"]

    it "returns a specific key from location object", ->
      @cy.location("href").then (href) ->
        expect(href).to.eq "/fixtures/html/dom.html"

    it "eventually resolves", ->
      _.delay ->
        win = cy.private("window")
        win.location.pathname = "users/1"
      , 100

      @cy.location().should("have.property", "pathname").and("match", /users/)

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          win = cy.private("window")
          win.location.pathname = "users/1"

        @cy.location("pathname").should("match", /users/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("end")).to.be.true

      it "eventually fails the assertion", (done) ->
        @cy.on "fail", (err) =>
          @chai.restore()

          expect(err.message).to.include(@log.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("error")).to.be.an.instanceof(Error)

          done()

        @cy.location("pathname").should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        logs = []

        @Cypress.on "log", (log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.location("pathname").should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (@log) =>

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.location("href").then ->
          expect(@log.get("end")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.location("href").then ->
          expect(@log.get("snapshot")).to.be.an("object")

      it "does not emit when {log: false} as options", ->
        @cy.location("href", {log: false}).then ->
          expect(@log).to.be.undefined

      it "does not emit when {log: false} as key", ->
        @cy.location({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs obj without a message", ->
        @cy.location().then ->
          obj = {
            name: "location"
            message: ""
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "logs obj with a message", ->
        @cy.location("origin").then ->
          obj = {
            name: "location"
            message: "origin"
          }

          _.each obj, (value, key) =>
            expect(@log.get(key)).to.deep.eq value

      it "#onConsole", ->
        @cy.location().then ->
          onConsole = @log.attributes.onConsole()

          expect(_(onConsole).keys()).to.deep.eq ["Command", "Returned"]
          expect(onConsole.Command).to.eq "location"
          expect(_(onConsole.Returned).keys()).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "toString"]
