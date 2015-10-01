describe "$Cypress.Cy Fixtures Commands", ->
  enterCommandTestingMode()

  ## call all of the fixture triggers async to simulate
  ## the real browser environment
  context "#fixture", ->
    beforeEach ->
      @responseIs = (resp, timeout = 10) =>
        @Cypress.trigger.restore?()

        @sandbox.spy(@Cypress, "trigger")

        trigger = @Cypress.trigger
        @Cypress.trigger = (args...) ->
          if args[0] is "fixture"
            trigger.apply(@, arguments)
            _.delay ->
              args[2](resp)
            , timeout
          else
            trigger.apply(@, arguments)

      @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture").callsArgWithAsync(2, {foo: "bar"})

    it "triggers 'fixture' on Cypress", ->
      @cy.fixture("foo").then (obj) ->
        expect(obj).to.deep.eq {foo: "bar"}

    it "can support an array of fixtures"

    it "can be aliases", ->
      @cy.fixture("foo").as("foo").then ->
        expect(@foo).to.deep.eq {foo: "bar"}

    describe "cancellation", ->
      it "cancels promise", (done) ->
        ## respond after 50 ms
        @responseIs({}, 50)

        @Cypress.on "fixture", =>
          @cmd = @cy.commands.first()
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
        @responseIs({__error: "some error"})

      it "throws if response contains __error key", (done) ->
        @cy.on "fail", (err) ->
          expect(err.message).to.eq "some error"
          done()

        @cy.fixture("err")

      it "logs command error", (done) ->
        logs = []

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
        @trigger = @sandbox.stub(@Cypress, "trigger").withArgs("fixture", "foo").callsArgWithAsync(2, {foo: "bar"})
        @trigger2 = @trigger.withArgs("fixture", "bar").callsArgWithAsync(2, {bar: "baz"})

      it "caches fixtures by name", ->
        cy.fixture("foo").then ->
          expect(@trigger).to.be.calledOnce

          cy.fixture("bar").then (obj) ->
            expect(obj).to.deep.eq {bar: "baz"}
            expect(@trigger2).to.be.calledOnce

            cy.fixture("foo").then (obj) ->
              expect(obj).to.deep.eq {foo: "bar"}
              expect(@trigger).to.be.calledOnce

      it "clones fixtures to prevent accidental mutation", ->
        cy.fixture("foo").then (obj) ->
          ## mutate the object
          obj.baz = "quux"

          cy.fixture("foo").then (obj2) ->
            obj2.lorem = "ipsum"
            expect(obj2).not.to.have.property("baz")

            cy.fixture("foo").then (obj3) ->
              expect(obj3).not.to.have.property("lorem")

