{ _ } = window.testUtils

describe "$Cypress.Cy Fixtures Commands", ->
  enterCommandTestingMode()

  ## call all of the fixture triggers async to simulate
  ## the real browser environment
  context "#fixture", ->
    beforeEach ->
      @respondWith = (resp, timeout = 10) =>
        @Cypress.once "fixture", (data, options, cb) ->
          _.delay ->
            cb(resp)
          , timeout

    afterEach ->
      @Cypress.off("fixture")

    it "triggers 'fixture' on Cypress", ->
      @respondWith({foo: "bar"})

      @cy.fixture("foo").then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can support an array of fixtures"

    it "can be aliases", ->
      @respondWith({foo: "bar"})

      @cy.fixture("foo").as("foo").then ->
        expect(@foo).to.deep.eq {foo: "bar"}

    it "can have encoding as second argument", ->
      @respondWith({foo: "bar"})

      @cy.fixture("foo", "ascii").then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can have encoding as second argument and options as third argument", ->
      @respondWith({foo: "bar"})

      @cy.fixture("foo", "ascii", {timeout: 1000}).then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    describe "cancellation", ->
      it "cancels promise", (done) ->
        ## respond after 50 ms
        @respondWith({}, 50)

        @Cypress.on "fixture", =>
          @cmd = @cy.queue.first()
          @Cypress.abort()

        @cy.on "cancel", (cancelledCmd) =>
          _.delay =>
            expect(cancelledCmd).to.eq(@cmd)
            expect(@cmd.get("subject")).to.be.undefined
            done()
          , 100

        @cy.fixture("foo")

    describe "errors", ->
      beforeEach ->
        @allowErrors()

      it "throws if fixturesFolder is set to false", (done) ->
        @sandbox.stub(@Cypress, "config").withArgs("fixturesFolder").returns(false)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error").message).to.eq("cy.fixture() is not valid because you have configured 'fixturesFolder' to false.")
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("name")).to.eq "fixture"
          done()

        @cy.fixture("foo")

      it "throws if response contains __error key", (done) ->
        @respondWith({__error: "some error"})

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("name")).to.eq "fixture"
          expect(@log.get("message")).to.eq "err"
          done()

        @cy.fixture("err")

      it "throws after timing out", (done) ->
        @respondWith({foo: "bar"}, 1000)

        logs = []

        @Cypress.on "log", (attrs, @log) =>
          logs.push(@log)

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq(1)
          expect(@log.get("error")).to.eq(err)
          expect(@log.get("state")).to.eq("failed")
          expect(@log.get("name")).to.eq "fixture"
          expect(@log.get("message")).to.eq "foo, {timeout: 50}"
          expect(err.message).to.eq("cy.fixture() timed out waiting '50ms' to receive a fixture. No fixture was ever sent by the server.")
          done()

        @cy.fixture("foo", {timeout: 50})

    describe "timeout", ->
      it "sets timeout to Cypress.config(responseTimeout)", ->
        @Cypress.config("responseTimeout", 2500)

        @respondWith({foo: "bar"})

        timeout = @sandbox.spy(@Cypress.Promise.prototype, "timeout")

        @cy.fixture("foo").then ->
          expect(timeout).to.be.calledWith(2500)

      it "can override timeout", ->
        @respondWith({foo: "bar"})

        timeout = @sandbox.spy(@Cypress.Promise.prototype, "timeout")

        @cy.fixture("foo", {timeout: 1000}).then ->
          expect(timeout).to.be.calledWith(1000)

      it "clears the current timeout and restores after success", ->
        @respondWith({foo: "bar"})

        @cy._timeout(100)

        calledTimeout = false
        _clearTimeout = @sandbox.spy(@cy, "_clearTimeout")

        @Cypress.on "fixture", =>
          calledTimeout = true
          expect(_clearTimeout).to.be.calledOnce

        @cy.fixture("foo").then ->
          expect(calledTimeout).to.be.true
          ## restores the timeout afterwards
          expect(@cy._timeout()).to.eq(100)

    describe "caching", ->
      it "caches fixtures by name", ->
        @respondWith({foo: "bar"})
        cy.fixture("foo").then (obj) =>
          expect(obj).to.deep.eq({foo: "bar"})

          @respondWith({bar: "baz"})
          cy.fixture("bar").then (obj) =>
            expect(obj).to.deep.eq {bar: "baz"}

            ## respond with an error now
            @respondWith({__error: "asdf"})
            cy.fixture("foo").then (obj) =>
              expect(obj).to.deep.eq {foo: "bar"}

      it "clones fixtures to prevent accidental mutation", ->
        @respondWith({foo: "bar"})

        cy.fixture("foo").then (obj) ->
          ## mutate the object
          obj.baz = "quux"

          cy.fixture("foo").then (obj2) ->
            obj2.lorem = "ipsum"
            expect(obj2).not.to.have.property("baz")

            cy.fixture("foo").then (obj3) ->
              expect(obj3).not.to.have.property("lorem")
