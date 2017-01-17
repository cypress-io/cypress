describe "$Cypress.Cy Agents Commands", ->
  enterCommandTestingMode()

  context "#stub", ->
    beforeEach ->
      @stub = @cy.stub()

    it "synchronously returns stub", ->
      expect(@stub).to.exist
      expect(@stub.returns).to.be.a("function")

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

  context "#spy(obj, 'method')", ->
    beforeEach ->
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

  context "#clock", ->
    beforeEach ->
      @window = @cy.private("window")

      @setTimeoutSpy = @sandbox.spy(@window, "setTimeout")

      @setImmediateSpy = @sandbox.stub()
      @window.setImmediate = @setImmediateSpy

    it "synchronously returns clock", ->
      clock = cy.clock()
      expect(clock).to.exist
      expect(clock.tick).to.be.a("function")

    it "proxies sinon clock, replacing window time methods", (done) ->
      clock = cy.clock()
      @window.setImmediate =>
        expect(@setImmediateSpy).not.to.be.called
        done()

      clock.tick()

    it "takes now arg", ->
      now = 1111111111111
      clock = cy.clock(now)
      expect(new @window.Date().getTime()).to.equal(now)
      clock.tick(4321)
      expect(new @window.Date().getTime()).to.equal(now + 4321)

    it "restores window time methods when calling restore", ->
      clock = cy.clock()
      @window.setImmediate =>
        expect(@setImmediateSpy).not.to.be.called
        clock.restore()
        expect(@window.setImmediate).to.equal(@setImmediateSpy)
      clock.tick()

    context "extra args for which functions to replace", ->

      it "replaces specified functions", (done) ->
        clock = cy.clock(null, "setImmediate")
        @window.setImmediate =>
          expect(@setImmediateSpy).not.to.be.called
          done()

        clock.tick()

      it "does not replace other functions", (done) ->
        clock = cy.clock(null, "setImmediate")
        @window.setTimeout =>
          expect(@setTimeoutSpy).to.be.called
          @window.setImmediate =>
            expect(@setImmediateSpy).not.to.be.called
            done()
          clock.tick()

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
