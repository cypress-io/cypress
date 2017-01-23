describe "$Cypress.Cy Agents Commands", ->
  enterCommandTestingMode()

  context "#stub", ->
    it "synchronously returns stub", ->
      stub = @cy.stub()
      expect(stub).to.exist
      expect(stub.returns).to.be.a("function")

    context "#stub()", ->
      beforeEach ->
        @stub = @cy.stub()

      it "proxies sinon stub", ->
        @stub()
        expect(@stub.callCount).to.equal(1)

      it "has sinon stub API", ->
        @stub.returns(true)
        result = @stub()
        expect(result).to.be.true

    context "#stub(obj, 'method')", ->
      beforeEach ->
        @originalCalled = false
        @obj = {
          foo: => @originalCalled = true
        }
        @stub = @cy.stub(@obj, "foo")

      it "proxies sinon stub", ->
        @obj.foo()
        expect(@stub.callCount).to.equal(1)

      it "replaces method", ->
        @obj.foo()
        expect(@originalCalled).to.be.false

    context "#stub(obj, 'method', replacerFn)", ->
      beforeEach ->
        @originalCalled = false
        @obj = {
          foo: => @originalCalled = true
        }
        @replacementCalled = false
        @stub = @cy.stub @obj, "foo", =>
          @replacementCalled = true

      it "proxies sinon stub", ->
        @obj.foo()
        expect(@stub.callCount).to.equal(1)

      it "replaces method with replacement", ->
        @obj.foo()
        expect(@originalCalled).to.be.false
        expect(@replacementCalled).to.be.true

    context "#as", ->
      beforeEach ->
        @logs = []
        @Cypress.on "log", (attrs, log) =>
          @logs.push(log)

        @stub = @cy.stub().as("myStub")

      it "returns stub", ->
        expect(@stub).to.have.property("callCount")

      it "updates instrument log with alias", ->
        expect(@logs[0].get("alias")).to.equal("myStub")
        expect(@logs[0].get("aliasType")).to.equal("agent")

      it "includes alias in invocation log", ->
        @stub()
        expect(@logs[1].get("alias")).to.equal("myStub")
        expect(@logs[1].get("aliasType")).to.equal("agent")

      it "includes alias in console props", ->
        @stub()
        consoleProps = @logs[1].get("consoleProps")()
        expect(consoleProps["Alias"]).to.equal("myStub")

    context "logging", ->
      beforeEach ->
        @logs = []
        @Cypress.on "log", (attrs, log) =>
          @logs.push(log)

        @obj = {foo: ->}
        @stub = @cy.stub(@obj, "foo").returns("return value")

      it "logs agent on creation", ->
        expect(@logs[0].get("name")).to.eq("stub-1")
        expect(@logs[0].get("type")).to.eq("stub-1")
        expect(@logs[0].get("instrument")).to.eq("agent")

      it "logs event for each invocation", ->
        @stub("foo", "bar")
        expect(@logs.length).to.equal(2)
        expect(@logs[1].get("name")).to.eq("stub-1")
        expect(@logs[1].get("message")).to.eq("foo(arg1, arg2)")
        expect(@logs[1].get("event")).to.be.true
        @stub("foo")
        expect(@logs.length).to.equal(3)
        expect(@logs[2].get("name")).to.eq("stub-1")
        expect(@logs[2].get("message")).to.eq("foo(arg1)")
        expect(@logs[2].get("event")).to.be.true

      it "increments callCount of agent log on each invocation", ->
        expect(@logs[0].get("callCount")).to.eq 0
        @stub("foo", "bar")
        expect(@logs[0].get("callCount")).to.eq 1
        @stub("foo", "baz")
        expect(@logs[0].get("callCount")).to.eq 2

      it "resets unique name counter on restore", ->
        expect(@logs[0].get("name")).to.equal("stub-1")
        @Cypress.trigger("restore")
        @cy.stub()
        expect(@logs[1].get("name")).to.equal("stub-1")

      context "#consoleProps", ->
        beforeEach ->
          @context = {}
          @stub.call(@context, "foo", "baz")
          @stub("foo", "baz")
          @consoleProps = @logs[1].get("consoleProps")()

        it "does not include 'command' or 'error' properties", ->
          expect(@consoleProps["Command"]).to.be.null
          expect(@consoleProps["Error"]).to.be.null

        it "includes reference to stub", ->
          expect(@consoleProps["stub"]).to.be.a("function")

        it "includes references to stubbed object", ->
          expect(@consoleProps["Stubbed Obj"]).to.be.equal(@obj)

        it "includes call count", ->
          expect(@consoleProps["Calls"]).to.equal(2)

        it "includes group with calls", ->
          expect(@consoleProps.groups()[0].name).to.equal("Call #1:")
          expect(@consoleProps.groups()[0].items["Arguments"]).to.eql(["foo", "baz"])
          expect(@consoleProps.groups()[0].items["Context"]).to.equal(@context)
          expect(@consoleProps.groups()[0].items["Returned"]).to.equal("return value")

  context "#spy(obj, 'method')", ->
    beforeEach ->
      @logs = []
      @Cypress.on "log", (attrs, log) =>
        @logs.push(log)

      @originalCalled = false
      @obj = {
        foo: => @originalCalled = true
      }
      @spy = @cy.spy @obj, "foo"

    it "synchronously returns spy", ->
      expect(@spy).to.exist
      expect(@spy.callCount).to.be.a("number")

    it "proxies sinon spy", ->
      @obj.foo()
      expect(@spy.callCount).to.equal(1)

    it "does not replace method", ->
      @obj.foo()
      expect(@originalCalled).to.be.true

    context "#as", ->
      beforeEach ->
        @logs = []
        @Cypress.on "log", (attrs, log) =>
          @logs.push(log)

        @spy = @cy.spy().as("mySpy")

      it "returns spy", ->
        expect(@spy).to.have.property("callCount")

      it "updates instrument log with alias", ->
        expect(@logs[0].get("alias")).to.equal("mySpy")
        expect(@logs[0].get("aliasType")).to.equal("agent")

      it "includes alias in invocation log", ->
        @spy()
        expect(@logs[1].get("alias")).to.equal("mySpy")
        expect(@logs[1].get("aliasType")).to.equal("agent")

      it "includes alias in console props", ->
        @spy()
        consoleProps = @logs[1].get("consoleProps")()
        expect(consoleProps["Alias"]).to.equal("mySpy")

    context "logging", ->
      ## same as cy.stub() except for name and type
      it "logs agent on creation", ->
        expect(@logs[0].get("name")).to.eq("spy-1")
        expect(@logs[0].get("type")).to.eq("spy-1")
        expect(@logs[0].get("instrument")).to.eq("agent")

      context "#consoleProps", ->
        beforeEach ->
          @obj.foo()
          @consoleProps = @logs[1].get("consoleProps")()

        it "includes reference to spy", ->
          expect(@consoleProps["spy"]).to.be.a("function")

        it "includes references to spied object", ->
          expect(@consoleProps["Spied Obj"]).to.be.equal(@obj)

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
          @Cypress.on "log", (attrs, @log) =>

          @cy.noop({})

        it "logs obj", ->
          spy = @agents.spy()
          spy("foo", "bar")

          expect(@log.get("name")).to.eq("spy-1")
          expect(@log.get("message")).to.eq("function(arg1, arg2)")
          expect(@log.get("type")).to.eq("parent")
          expect(@log.get("state")).to.eq("passed")
          expect(@log.get("snapshots").length).to.eq(1)
          expect(@log.get("snapshots")[0]).to.be.an("object")

        it "increments callCount", ->
          spy = @agents.spy()

          @agent = @log

          expect(@agent.get("callCount")).to.eq 0
          spy("foo", "bar")
          expect(@agent.get("callCount")).to.eq 1
          spy("foo", "baz")
          expect(@agent.get("callCount")).to.eq 2

        context "#consoleProps", ->

    describe ".log", ->
      it "logs even without cy current", ->
        spy = @agents.spy()

        logs = []

        @Cypress.on "log", (attrs, log) ->
          logs.push log

        spy("foo")

        commands = _(logs).filter (log) ->
          log.get("instrument") is "command"

        expect(commands.length).to.eq(1)
