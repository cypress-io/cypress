_ = Cypress._
$ = Cypress.$

describe "src/cy/commands/location", ->
  beforeEach ->
    cy.visit("/fixtures/generic.html")

  context "#url", ->
    it "returns the location href", ->
      cy.url().then (url) ->
        expect(url).to.eq "http://localhost:3500/fixtures/generic.html"

    it "eventually resolves", ->
      _.delay =>
        win = cy.state("window")
        win.location.href = "/foo/bar/baz.html"
      , 100

      cy.url().should("match", /baz/).and("eq", "http://localhost:3500/foo/bar/baz.html")

    it "catches thrown errors", ->
      cy.stub(Cypress.utils, "locToString")
      .onFirstCall().throws(new Error)
      .onSecondCall().returns("http://localhost:3500/baz.html")

      cy.url().should("include", "/baz.html")

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.on "command:retry", _.after 2, _.once =>
          win = cy.state("window")
          win.location.href = "/foo/bar/baz.html"

        cy.url().should("match", /baz/).then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.url().should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(2)
          done()

        cy.url().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "ends immediately", ->
        cy.url().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
          cy.url().then ->
            lastLog = @lastLog

            expect(lastLog.get("snapshots").length).to.eq(1)
            expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "logs obj", ->
        cy.url().then ->
          obj = {
            name: "url"
            message: ""
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        cy.url({log: false}).then ->
          expect(@log).to.be.undefined

      it "#consoleProps", ->
        cy.url().then ->
          consoleProps = @lastLog.invoke("consoleProps")

          expect(consoleProps).to.deep.eq {
            Command: "url"
            Yielded: "http://localhost:3500/fixtures/generic.html"
          }

  context "#hash", ->
    it "returns the location hash", ->
      cy.hash().then (hash) ->
        expect(hash).to.eq ""

    it "eventually resolves", ->
      _.delay ->
        win = cy.state("window")
        win.location.hash = "users/1"
      , 100

      cy.hash().should("match", /users/).and("eq", "#users/1")

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.on "command:retry", _.after 2, =>
          win = cy.state("window")
          win.location.hash = "users/1"

        cy.hash().should("match", /users/).then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.hash().should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        cy.on "fail", =>
          expect(@logs.length).to.eq(2)
          done()

        cy.hash().should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "ends immediately", ->
        cy.hash().then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.hash().then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "logs obj", ->
        cy.hash().then ->
          obj = {
            name: "hash"
            message: ""
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).to.deep.eq value

      it "does not emit when {log: false}", ->
        cy.hash({log: false}).then ->
          expect(@log).to.be.undefined

      it "#consoleProps", ->
        cy.hash().then ->
          consoleProps = @lastLog.invoke("consoleProps")

          expect(consoleProps).to.deep.eq {
            Command: "hash"
            Yielded: ""
          }

  context "#location", ->
    it "returns the location object", ->
      cy.location().then (loc) ->
        expect(loc).to.have.keys ["auth", "authObj", "hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "originPolicy", "superDomain", "toString"]

    it "returns a specific key from location object", ->
      cy.location("href").then (href) ->
        expect(href).to.eq "http://localhost:3500/fixtures/generic.html"

    it "eventually resolves", ->
      _.delay ->
        win = cy.state("window")
        win.location.pathname = "users/1"
      , 100

      cy.location().should("have.property", "pathname").and("match", /users/)

    describe "assertion verification", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if log.get("name") is "assert"
            @lastLog = log

        return null

      it "eventually passes the assertion", ->
        cy.on "command:retry", _.after 2, _.once =>
          win = cy.state("window")
          win.location.pathname = "users/1"

        cy.location("pathname").should("match", /users/).then ->
          lastLog = @lastLog

          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("passed")
          expect(lastLog.get("ended")).to.be.true

    describe "errors", ->
      beforeEach ->
        Cypress.config("defaultCommandTimeout", 100)

        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "throws when passed a non-existent key", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).to.include("Location object does not have key: `ladida`")
          expect(err.docsUrl).to.include("https://on.cypress.io/location")
          expect(lastLog.get("name")).to.eq("location")
          expect(lastLog.get("state")).to.eq("failed")

          done()

        cy.location('ladida')

      it "eventually fails the assertion", (done) ->
        cy.on "fail", (err) =>
          lastLog = @lastLog

          expect(err.message).to.include(lastLog.get("error").message)
          expect(err.message).not.to.include("undefined")
          expect(lastLog.get("name")).to.eq("assert")
          expect(lastLog.get("state")).to.eq("failed")
          expect(lastLog.get("error")).to.be.an.instanceof(chai.AssertionError)

          done()

        cy.location("pathname").should("eq", "not-this")

      it "does not log an additional log on failure", (done) ->
        logs = []

        cy.on "log:added", (attrs, log) ->
          logs.push(log)

        cy.on "fail", =>
          expect(@logs.length).to.eq(2)
          done()

        cy.location("pathname").should("eq", "not-this")

    describe ".log", ->
      beforeEach ->
        @logs = []

        cy.on "log:added", (attrs, log) =>
          @lastLog = log
          @logs.push(log)

        return null

      it "ends immediately", ->
        cy.location("href").then ->
          lastLog = @lastLog

          expect(lastLog.get("ended")).to.be.true
          expect(lastLog.get("state")).to.eq("passed")

      it "snapshots immediately", ->
        cy.location("href").then ->
          lastLog = @lastLog

          expect(lastLog.get("snapshots").length).to.eq(1)
          expect(lastLog.get("snapshots")[0]).to.be.an("object")

      it "does not emit when {log: false} as options", ->
        cy.location("href", {log: false}).then ->
          expect(@log).to.be.undefined

      it "does not emit when {log: false} as key", ->
        cy.location({log: false}).then ->
          expect(@log).to.be.undefined

      it "logs obj without a message", ->
        cy.location().then ->
          obj = {
            name: "location"
            message: ""
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).to.deep.eq value

      it "logs obj with a message", ->
        cy.location("origin").then ->
          obj = {
            name: "location"
            message: "origin"
          }

          lastLog = @lastLog

          _.each obj, (value, key) =>
            expect(lastLog.get(key)).to.deep.eq value

      it "#consoleProps", ->
        cy.location().then ->
          consoleProps = @lastLog.invoke("consoleProps")

          expect(_.keys(consoleProps)).to.deep.eq ["Command", "Yielded"]
          expect(consoleProps.Command).to.eq "location"
          expect(_.keys(consoleProps.Yielded)).to.deep.eq ["auth", "authObj", "hash", "href", "host", "hostname", "origin", "pathname", "port", "protocol", "search", "originPolicy", "superDomain", "toString"]
