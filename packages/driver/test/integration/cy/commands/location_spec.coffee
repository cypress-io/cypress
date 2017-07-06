{ _ } = window.testUtils

describe "$Cypress.Cy Location Commands", ->
  enterCommandTestingMode()

  context "#url", ->
    it "returns the location href", ->
      @cy.url().then (url) ->
        expect(url).to.eq "http://localhost:3500/fixtures/dom.html"

    it "eventually resolves", ->
      _.delay =>
        win = @cy.privateState("window")
        win.location.href = "/foo/bar/baz.html"
      , 100

      @cy.url().should("match", /baz/).and("eq", "http://localhost:3500/foo/bar/baz.html")

    it "catches thrown errors", ->
      @sandbox.stub(@cy, "__location")
      .onFirstCall().throws(new Error)
      .onSecondCall().returns("http://localhost:3500/baz.html")

      @cy.url().should("include", "/baz.html")

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, _.once =>
          win = @cy.privateState("window")
          win.location.href = "/foo/bar/baz.html"

        @cy.url().should("match", /baz/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.url().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.url().then ->
          expect(@log.get("ended")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.url().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

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

      it "#consoleProps", ->
        @cy.url().then ->
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps).to.deep.eq {
            Command: "url"
            Yielded: "http://localhost:3500/fixtures/dom.html"
          }

  context "#hash", ->
    it "returns the location hash", ->
      @cy.hash().then (hash) ->
        expect(hash).to.eq ""

    it "eventually resolves", ->
      _.delay ->
        win = cy.privateState("window")
        win.location.hash = "users/1"
      , 100

      @cy.hash().should("match", /users/).and("eq", "#users/1")

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, =>
          win = cy.privateState("window")
          win.location.hash = "users/1"

        @cy.hash().should("match", /users/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.hash().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>
          if @log.get("name") is "location"
            throw new Error("cy.location() should not have logged out.")

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.hash().then ->
          expect(@log.get("ended")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.hash().then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

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

      it "#consoleProps", ->
        @cy.hash().then ->
          consoleProps = @log.attributes.consoleProps()
          expect(consoleProps).to.deep.eq {
            Command: "hash"
            Yielded: ""
          }

  context "#location", ->
    it "returns the location object", ->
      @cy.location().then (loc) ->
        keys = _.keys loc
        expect(keys).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "originPolicy", "superDomain", "toString"]

    it "returns a specific key from location object", ->
      @cy.location("href").then (href) ->
        expect(href).to.eq "http://localhost:3500/fixtures/dom.html"

    it "eventually resolves", ->
      _.delay ->
        win = cy.privateState("window")
        win.location.pathname = "users/1"
      , 100

      @cy.location().should("have.property", "pathname").and("match", /users/)

    describe "assertion verification", ->
      beforeEach ->
        @allowErrors()
        @currentTest.timeout(100)

        @chai = $Cypress.Chai.create(@Cypress, {})
        @Cypress.on "log", (attrs, log) =>
          if log.get("name") is "assert"
            @log = log

      afterEach ->
        @chai.restore()

      it "eventually passes the assertion", ->
        @cy.on "retry", _.after 2, _.once =>
          win = @cy.privateState("window")
          win.location.pathname = "users/1"

        @cy.location("pathname").should("match", /users/).then ->
          @chai.restore()

          expect(@log.get("name")).to.eq("assert")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("ended")).to.be.true

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

        @Cypress.on "log", (attrs, log) ->
          logs.push(log)

        @cy.on "fail", ->
          expect(logs.length).to.eq(2)
          done()

        @cy.location("pathname").should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      afterEach ->
        delete @log

      it "ends immediately", ->
        @cy.location("href").then ->
          expect(@log.get("ended")).to.be.true
          expect(@log.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        @cy.location("href").then ->
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

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

      it "#consoleProps", ->
        @cy.location().then ->
          consoleProps = @log.attributes.consoleProps()

          expect(_.keys(consoleProps)).to.deep.eq ["Command", "Yielded"]
          expect(consoleProps.Command).to.eq "location"
          expect(_.keys(consoleProps.Yielded)).to.deep.eq ["hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "originPolicy", "superDomain", "toString"]
