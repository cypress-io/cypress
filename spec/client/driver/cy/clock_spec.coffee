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

  it "throws if called twice", ->
    @cy.clock()
    expect(=> @cy.clock()).to.throw("cy.clock() can only be called once per test")

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
