describe "$Cypress.Cy Clock Commands", ->
  enterCommandTestingMode()

  beforeEach ->
    @window = @cy.private("window")

    @setTimeoutSpy = @sandbox.spy(@window, "setTimeout")

    @setImmediateSpy = @sandbox.stub()
    @window.setImmediate = @setImmediateSpy

  it "synchronously returns clock", ->
    clock = @cy.clock()
    expect(clock).to.exist
    expect(clock.tick).to.be.a("function")

  it "proxies lolex clock, replacing window time methods", (done) ->
    clock = @cy.clock()
    @window.setImmediate =>
      expect(@setImmediateSpy).not.to.be.called
      done()

    clock.tick()

  it "takes now arg", ->
    now = 1111111111111
    clock = @cy.clock(now)
    expect(new @window.Date().getTime()).to.equal(now)
    clock.tick(4321)
    expect(new @window.Date().getTime()).to.equal(now + 4321)

  it "restores window time methods when calling restore", ->
    clock = @cy.clock()
    @window.setImmediate =>
      expect(@setImmediateSpy).not.to.be.called
      clock.restore()
      expect(@window.setImmediate).to.equal(@setImmediateSpy)
    clock.tick()

  it "unsets clock after restore", ->
    clock = @cy.clock()
    clock.restore()
    expect(@cy.prop("clock")).to.be.null

  it "automatically restores clock on 'restore' event", ->
    clock = {restore: @sandbox.stub()}
    @cy.prop("clock", clock)
    @Cypress.trigger("restore")
    expect(clock.restore).to.be.called

  it "unsets clock before test run", ->
    @cy.prop("clock", {})
    @Cypress.trigger("test:before:run", {})
    expect(@cy.prop("clock")).to.be.null

  context "errors", ->
    it "throws if called twice", ->
      @cy.clock()
      expect(=> @cy.clock()).to.throw("cy.clock() can only be called once per test")

    it "throws if now is not a number or options object", ->
      expect(=> @cy.clock("250")).to.throw("cy.clock() only accepts a number or an options object for its first argument. You passed: '250'")

    it "throws if methods is not an array of strings or options object", ->
      expect(=> @cy.clock(null, "setTimeout")).to.throw("cy.clock() only accepts an array of function names or an options object for its second argument. You passed: 'setTimeout'")

  context "arg for which functions to replace", ->
    beforeEach ->
      @clock = @cy.clock(null, ["setImmediate"])

    it "replaces specified functions", (done) ->
      @window.setImmediate =>
        expect(@setImmediateSpy).not.to.be.called
        done()

      @clock.tick()

    it "does not replace other functions", (done) ->
      @window.setTimeout =>
        expect(@setTimeoutSpy).to.be.called
        @window.setImmediate =>
          expect(@setImmediateSpy).not.to.be.called
          done()
        @clock.tick()

  context "options", ->
    beforeEach ->
      @Cypress.on "log", (attrs, @log) =>

    it "can be first arg", ->
      @cy.clock({log: false})
      expect(@log).to.be.undefined

    it "can be second arg", ->
      @cy.clock(new Date().getTime(), {log: false})
      expect(@log).to.be.undefined

    it "can be third arg", ->
      @cy.clock(new Date().getTime(), ["setTimeout"], {log: false})
      expect(@log).to.be.undefined

  context "window changes", ->
    beforeEach ->
      @clock = @cy.clock(null, ["setTimeout"])

    it "binds to default window before visit", ->
      onSetTimeout = @sandbox.spy()
      @cy.private("window").setTimeout(onSetTimeout)
      @clock.tick()
      expect(onSetTimeout).to.be.called #.not.to.equal(@setTimeoutSpy)

    it "re-binds to new window when window changes", ->
      newWindow = {
        setTimeout: ->
        XMLHttpRequest: {
          prototype: {}
        }
      }
      @Cypress.trigger("before:window:load", newWindow)
      onSetTimeout = @sandbox.spy()
      newWindow.setTimeout(onSetTimeout)
      @clock.tick()
      expect(onSetTimeout).to.be.called

  context "logging", ->
    beforeEach ->
      @logs = []
      @Cypress.on "log", (attrs, log) =>
        @logs.push(log)

    it "logs when created", ->
      @cy.clock()

      log = @logs[0]
      expect(@logs.length).to.equal(1)
      expect(log.get("name")).to.eq("clock")
      expect(log.get("message")).to.eq("create / replace methods")
      expect(log.get("type")).to.eq("parent")
      expect(log.get("state")).to.eq("passed")
      expect(log.get("snapshots").length).to.eq(1)
      expect(log.get("snapshots")[0]).to.be.an("object")

    it "logs when ticked", ->
      clock = @cy.clock()
      clock.tick(250)

      log = @logs[1]
      expect(@logs.length).to.equal(2)
      expect(log.get("name")).to.eq("clock")
      expect(log.get("message")).to.eq("tick 250ms")

    it "logs before and after snapshots when ticked", ->
      clock = @cy.clock()
      clock.tick(250)

      log = @logs[1]
      expect(log.get("snapshots").length).to.eq(2)
      expect(log.get("snapshots")[0].name).to.equal("before")
      expect(log.get("snapshots")[1].name).to.equal("after")

    it "logs when restored", ->
      clock = @cy.clock()
      clock.restore()

      log = @logs[1]
      expect(@logs.length).to.equal(2)
      expect(log.get("name")).to.eq("clock")
      expect(log.get("message")).to.eq("restore")

    it "does not log when auto-restored", ->
      @cy.clock()

      @Cypress.trigger("restore")
      expect(@logs.length).to.equal(1)

    it "does not log when log: false", ->
      @cy.clock({log: false})
      expect(@logs.length).to.equal(0)

    context "#consoleProps", ->
      beforeEach ->
        clock = @cy.clock(100, ["setTimeout"])
        clock.tick(100)
        @consoleProps = @logs[1].get("consoleProps")()

      it "includes clock's now value", ->
        expect(@consoleProps["Now"]).to.equal(200)

      it "includes methods replaced by clock", ->
        expect(@consoleProps["Methods replaced"]).to.eql(["setTimeout"])
