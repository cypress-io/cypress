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

    context "#resolves", ->
      beforeEach ->
        @obj = {foo: ->}
        @stub = @cy.stub(@obj, "foo")

      it "has resolves method", ->
        expect(@stub.resolves).to.be.a("function")

      it "resolves promise", ->
        @stub.resolves("foo")
        @obj.foo().then (foo) ->
          expect(foo).to.equal("foo")

    context "#rejects", ->
      beforeEach ->
        @obj = {foo: ->}
        @stub = @cy.stub(@obj, "foo")

      it "has rejects method", ->
        expect(@stub.rejects).to.be.a("function")

      it "rejects promise", ->
        error = new Error()
        @stub.rejects(error)
        @obj.foo()
        .then ->
          throw new Error("Should throw error")
        .catch (err) ->
          expect(err).to.equal(error)

    context "#withArgs", ->
      beforeEach ->
        @logs = []
        @Cypress.on "log", (attrs, log) =>
          @logs.push(log)

        @obj = {foo: ->}
        @stub = @cy.stub(@obj, "foo")
        @stubWithArgs = @stub.withArgs("foo")

      it "can be aliased", ->
        @stubWithArgs.as("withFoo")
        expect(@logs[1].get("alias")).to.equal("withFoo")

      context "logging", ->
        it "creates new log instrument", ->
          expect(@logs.length).to.equal(2)
          expect(@logs[1].get("name")).to.equal("stub-2")

        describe "on invocation", ->
          it "only logs once", ->
            @obj.foo("foo")
            expect(@logs.length).to.equal(3)

          it "includes both counts in name", ->
            @obj.foo("foo")
            expect(@logs[2].get("name")).to.equal("stub-1/2")

          it "has no alias if no aliases set", ->
            @obj.foo("foo")
            expect(@logs[2].get("alias")).to.be.undefined

          it "has withArgs alias if it's the only one set", ->
            @stubWithArgs.as("withFoo")
            @obj.foo("foo")
            expect(@logs[2].get("alias")).to.eql(["withFoo"])

          it "has parent alias if it's the only one set", ->
            @stub.as("noArgs")
            @obj.foo("foo")
            expect(@logs[2].get("alias")).to.eql(["noArgs"])

          it "has both aliases if both set", ->
            @stub.as("noArgs")
            @stubWithArgs.as("withFoo")
            @obj.foo("foo")
            expect(@logs[2].get("alias")).to.eql(["noArgs", "withFoo"])

          it "logs parent if invoked without necessary args", ->
            @obj.foo()
            expect(@logs[2].get("name")).to.equal("stub-1")

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
        expect(@logs[1].get("alias")).to.eql(["myStub"])
        expect(@logs[1].get("aliasType")).to.equal("agent")

      it "includes alias in console props", ->
        @stub()
        consoleProps = @logs[1].get("consoleProps")()
        expect(consoleProps["Alias"]).to.eql("myStub")

      it "updates the displayName of the agent", ->
        @cy.then ->
          expect(@myStub.displayName).to.equal("myStub")

      it "stores the lookup as an alias", ->
        expect(@cy.prop("aliases").myStub).to.be.defined

      it "stores the agent as the subject", ->
        expect(@cy.prop("aliases").myStub.subject).to.equal(@stub)

      it "assigns subject to runnable ctx", ->
        @cy.then ->
          expect(@myStub).to.eq(@stub)

      describe "errors", ->
        beforeEach ->
          @allowErrors()

        _.each [null, undefined, {}, [], 123], (value) =>
          it "throws when passed: #{value}", ->
            expect(=> @cy.stub().as(value)).to.throw("cy.as() can only accept a string.")

        it "throws on blank string", ->
          expect(=> @cy.stub().as("")).to.throw("cy.as() cannot be passed an empty string.")

        _.each ["test", "runnable", "timeout", "slow", "skip", "inspect"], (blacklist) ->
          it "throws on a blacklisted word: #{blacklist}", ->
            expect(=> @cy.stub().as(blacklist)).to.throw("cy.as() cannot be aliased as: '#{blacklist}'. This word is reserved.")

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
      ## same as cy.stub(), so just some smoke tests here
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
      @sandbox.spy console, "warn"
      @agents = @cy.agents()

    it "logs deprecation warning", ->
      expect(console.warn).to.be.calledWith("Cypress Warning: cy.agents() is deprecated. Use cy.stub() and cy.spy() instead.")

    it "synchronously returns #spy and #stub methods", ->
      expect(@agents.spy).to.be.a("function")
      expect(@agents.spy().callCount).to.be.a("number")
      expect(@agents.stub).to.be.a("function")
      expect(@agents.stub().returns).to.be.a("function")
