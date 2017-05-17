describe "$Cypress.Cy Debugging Commands", ->
  enterCommandTestingMode()

  beforeEach ->
    @utilsLog = @sandbox.stub($Cypress.utils, "log")

  context "#debug", ->
    it "does not change the subject", ->
      select = @cy.$$("select[name=maps]")

      @cy.get("select[name=maps]").debug().then ($select) ->
        expect($select).to.match select

    it "logs current subject", ->
      obj = {foo: "bar"}

      @cy.wrap(obj).its("foo").debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", "bar")

    it "logs previous command", ->
      @cy.wrap({}).debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Command Name: ", "wrap")
        expect(@utilsLog).to.be.calledWithMatch("Command Args: ", [{}])
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", {})

    it "logs undefined on being parent", ->
      @cy.debug().then ->
        expect(@utilsLog).to.be.calledWithMatch("Current Subject: ", undefined)
        expect(@utilsLog).to.be.calledWithMatch("Command Name: ", undefined)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        @cy
          .wrap([], {log: false})
          .debug({log: false}).then ->
            expect(@log).to.be.undefined
