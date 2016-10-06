describe "$Cypress.Cy Debugging Commands", ->
  enterCommandTestingMode()

  context "#debug", ->
    it "does not change the subject", ->
      select = @cy.$$("select[name=maps]")

      @cy.get("select[name=maps]").debug().then ($select) ->
        expect($select).to.match select

    it "logs current subject", ->
      obj = {foo: "bar"}
      log = @sandbox.spy(console, "log")

      @cy.wrap(obj).its("foo").debug().then ->
        expect(log).to.be.calledWithMatch("Current Subject: ", "bar")

    it "logs previous command", ->
      log = @sandbox.spy(console, "log")

      @cy.wrap({}).debug().then ->
        # prints bar to console.log
        expect(log).to.be.calledWithMatch("Command Name: ", "wrap")
        expect(log).to.be.calledWithMatch("Command Args: ", [{}])
        expect(log).to.be.calledWithMatch("Current Subject: ", {})

    it "logs undefined on being parent", ->
      log = @sandbox.spy(console, "log")

      @cy.debug().then ->
        expect(log).to.be.calledWithMatch("Current Subject: ", undefined)
        expect(log).to.be.calledWithMatch("Command Name: ", undefined)

    describe ".log", ->
      beforeEach ->
        @Cypress.on "log", (attrs, @log) =>

      it "can turn off logging", ->
        @cy
          .wrap([], {log: false})
          .debug({log: false}).then ->
            expect(@log).to.be.undefined
