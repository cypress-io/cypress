describe "$Cypress.Cy Agents Commands", ->
  enterCommandTestingMode()

  context "#agents", ->
    beforeEach ->
      @agents = @cy.agents()

    it "is synchronous", ->
      expect(@agents).to.have.property("spy")
      expect(@agents).to.have.property("stub")
      expect(@agents).to.have.property("mock")

    it "uses existing sandbox"

    describe "#spy", ->
      it "proxies to sinon spy", ->
        spy = @agents.spy()
        spy()
        expect(spy.callCount).to.eq(1)

      describe ".log", ->
        beforeEach ->
          @Cypress.on "log", (@log) =>

          @cy.noop({})

        it "logs obj", ->
          spy = @agents.spy()
          spy("foo", "bar")

          expect(@log.get("name")).to.eq("spy-1")
          expect(@log.get("message")).to.eq("function(arg1, arg2)")
          expect(@log.get("type")).to.eq("parent")
          expect(@log.get("state")).to.eq("success")
          expect(@log.get("snapshot")).to.be.an("object")

        context "#onConsole", ->
