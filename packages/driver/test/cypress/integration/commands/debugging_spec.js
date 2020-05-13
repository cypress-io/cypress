Promise = Cypress.Promise

describe "src/cy/commands/debugging", ->
  context "#debug", ->
    beforeEach ->
      @utilsLog = cy.stub(Cypress.utils, "log")

    it "does not change the subject", ->
      cy.wrap({}).debug().then (subject) ->
        expect(subject).to.deep.eq({})

    it "logs current subject", ->
      obj = {foo: "bar"}

      cy.wrap(obj).its("foo").debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", "bar")

    it "logs previous command", ->
      cy.wrap({}).debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Command Name: ", "wrap")
        expect(@utilsLog).to.be.calledWithMatch("Command Args: ", [{}])
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", {})

    it "logs undefined on being parent", ->
      cy.debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", undefined)
        expect(@utilsLog).to.be.calledWithMatch("Command Name: ", undefined)

    describe ".log", ->
      beforeEach ->
        cy.on "log:added", (attrs, log) =>
          if attrs.name is "debug"
            @lastLog = log

        return null

      it "can turn off logging", ->
        cy
          .wrap([], {log: false})
          .debug({log: false}).then ->
            expect(@lastLog).to.be.undefined

  context "#pause", ->
    beforeEach ->
      cy.on "log:added", (attrs, log) =>
        if attrs.name is "pause"
          @lastLog = log

      return null

    it "can pause between each command and skips assertions", ->
      expected = false

      cy.once "paused", (name) =>
        ## should be pending
        expect(@lastLog.get("state")).to.eq("pending")

        expect(name).to.eq("wrap")

        cy.once "paused", (name) ->
          expected = true

          expect(name).to.eq("then")

          ## resume the rest of the commands so this
          ## test ends
          Cypress.emit("resume:all")

        Cypress.emit("resume:next")

      cy.pause().wrap({}).should("deep.eq", {}).then ->
        expect(expected).to.be.true

        ## should be pending
        expect(@lastLog.get("state")).to.eq("passed")

        ## should no longer have onPaused
        expect(cy.state("onPaused")).to.be.null
