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

        it "increments callCount", ->
          spy = @agents.spy()

          @agent = @log

          expect(@agent.get("callCount")).to.eq 0
          spy("foo", "bar")
          expect(@agent.get("callCount")).to.eq 1
          spy("foo", "baz")
          expect(@agent.get("callCount")).to.eq 2

        context "#onConsole", ->

    describe ".log", ->
      it "logs even without cy current", ->
        spy = @agents.spy()

        logs = []

        @Cypress.on "log", (log) ->
          logs.push log

        spy("foo")

        commands = _(logs).filter (log) ->
          log.get("event") is "command"

        expect(commands).to.have.length(1)