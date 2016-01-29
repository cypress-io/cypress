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

      @cy.title({log: false}).debug().then ->
        # prints bar to console.log
        expect(log).to.be.calledWithMatch("Previous Command Name: ", "title")
        expect(log).to.be.calledWithMatch("Previous Command Args: ")

        ## get the 3rd call to console.log (which is for args)
        ## and drill into the options object to ensure that
        ## it has log false
        args = log.getCall(2).args[1]
        expect(args[0].log).to.be.false

    it "logs undefined on being parent", ->
      log = @sandbox.spy(console, "log")

      @cy.debug().then ->
        expect(log).to.be.calledWithMatch("Current Subject: ", undefined)
        expect(log).to.be.calledWithMatch("Previous Command Name: ", undefined)


