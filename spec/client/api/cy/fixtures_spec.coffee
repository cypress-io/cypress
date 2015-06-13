describe "$Cypress.Cy Fixtures Commands", ->
  enterCommandTestingMode()

  context "#fixture", ->
    beforeEach ->
      @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWith(2, {foo: "bar"})

    it "triggers 'fixture' on Cypress", ->
      @cy.fixture("foo").then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can support an array of fixtures"

    it "can be aliases", ->
      @cy.fixture("foo").as("foo").then ->
        expect(@foo).to.deep.eq {foo: "bar"}

    describe "errors", ->
      beforeEach ->
        @allowErrors()
        @trigger.withArgs("fixture").callsArgWith(2, {__error: "some error"})

      it "throws if response contains __error key", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "some error"
          done()

        @cy.fixture("err")

      it "logs command error", (done) ->
        logs = []

        _this = @

        ## we have to restore the trigger when commandErr is called
        ## so that something logs out!
        @cy.commandErr = _.wrap @cy.commandErr, (orig, args...) ->
          _this.Cypress.trigger.restore()
          orig.apply(@, args...)

        @Cypress.on "log", (@log) =>
          logs.push log

        @cy.on "fail", (err) =>
          expect(logs.length).to.eq 1
          expect(@log.get("name")).to.eq "fixture"
          expect(@log.get("message")).to.eq "err"
          done()

        @cy.fixture("err")

    describe "caching", ->
      beforeEach ->
        @Cypress.trigger.restore()
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture", "foo").callsArgWith(2, {foo: "bar"})
        @trigger2 = @trigger.withArgs("fixture", "bar").callsArgWith(2, {bar: "baz"})

      it "caches fixtures by name", ->
        cy.fixture("foo").then ->
          expect(@trigger).to.be.calledOnce

          cy.fixture("bar").then (obj) ->
            expect(obj).to.deep.eq {bar: "baz"}
            expect(@trigger2).to.be.calledOnce

            cy.fixture("foo").then (obj) ->
              expect(obj).to.deep.eq {foo: "bar"}
              expect(@trigger).to.be.calledOnce

