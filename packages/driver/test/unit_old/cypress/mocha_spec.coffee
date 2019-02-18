{ $, _ } = window.testUtils

m = window.mocha

describe "$Cypress.Mocha API", ->
  beforeEach ->
    @Cypress = $Cypress.create()
    @iframe = $("<iframe />").appendTo $("body")

  afterEach ->
    ## restore mocha test global
    window.mocha = m
    @iframe.remove()

  context ".create", ->
    it "removes window.mocha", ->
      ## uhhhh for some reason deleting window.mocha
      ## then points to a reference of the DOM element
      ## with the id=mocha ??
      $Cypress.Mocha.create(@Cypress, @iframe)
      expect(window.mocha).not.to.have.property("run")

    it "assigns new mocha instance to Cypress.mocha", ->
      $Cypress.Mocha.create(@Cypress, @iframe)
      expect(@Cypress.mocha).to.be.instanceof $Cypress.Mocha

  context "#constructor", ->
    it "stores mocha instance as a property", ->
      mocha = $Cypress.Mocha.create(@Cypress, @iframe)
      expect(mocha.mocha).to.be.instanceof Mocha

    it "has an empty function as the reporter with arity 0", ->
      mocha = $Cypress.Mocha.create(@Cypress, @iframe)
      expect(mocha.mocha._reporter.length).to.eq 0

    it "sets enableTimeouts to false", ->
      mocha = $Cypress.Mocha.create(@Cypress, @iframe)
      expect(mocha.mocha.options.enableTimeouts).to.be.false

    it "calls #override", ->
      override = @sandbox.spy $Cypress.Mocha.prototype, "override"
      $Cypress.Mocha.create(@Cypress, @iframe)
      expect(override).to.be.called

    it "calls #listeners", ->
      listeners = @sandbox.spy $Cypress.Mocha.prototype, "listeners"
      $Cypress.Mocha.create(@Cypress, @iframe)
      expect(listeners).to.be.called

  context "#listeners", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    describe "stop", ->
      it "calls stop", ->
        stop = @sandbox.stub @mocha, "stop"
        @Cypress.trigger("stop")
        expect(stop).to.be.calledOnce

    it "unbinds previous mocha listeners on Cypress", ->
      totalEvents = =>
        _.reduce @Cypress._events, (memo, value, key) ->
          memo += value.length
        , 0

      count = totalEvents()

      ## after instantiating another mocha
      $Cypress.Mocha.create(@Cypress, @iframe)

      ## we shouldn't have any additional events
      expect(totalEvents()).not.to.be.gt count

  context "#stop", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    it "calls restore", ->
      restore = @sandbox.spy @mocha, "restore"
      @Cypress.trigger("stop")
      expect(restore).to.be.calledOnce

    it "removeAllListeners on mocha.suite", ->
      removeAllListeners = @sandbox.spy @mocha.mocha.suite, "removeAllListeners"
      @Cypress.trigger("stop")
      expect(removeAllListeners).to.be.calledOnce

    it "nulls out mocha.suite", ->
      ## we will lose a reference to this
      ## because it is removed
      mocha = @mocha.mocha
      expect(@mocha.mocha.suite).to.be.ok
      @Cypress.trigger("stop")
      expect(mocha.suite).to.be.null

    it "null outs Cypress.mocha", ->
      expect(@Cypress.mocha).to.be.ok
      @Cypress.trigger("stop")
      expect(@Cypress.mocha).to.be.null

  context "#getRunner", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    it "returns the runner instance", ->
      runner = @mocha.getRunner()
      expect(runner).to.be.instanceof Mocha.Runner

    it "does NOT start the runner", ->
      runSuite = @sandbox.spy Mocha.Runner.prototype, "runSuite"
      runner = @mocha.getRunner()

      ## make sure delay is undefined so we know
      ## the runner will start immediately!
      expect(runner._delay).to.be.undefined

      ## make sure our runner's runSuite function
      ## did not kick off running the tests!
      expect(runSuite).not.to.be.called

    it "restores the Mocha.Runner::run to the original", ->
      run = Mocha.Runner::run
      @mocha.getRunner()
      expect(Mocha.Runner::run).to.eq run

  context "#set", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)
      @contentWindow = @iframe.prop("contentWindow")

    it "sets mocha", ->
      @mocha.set @contentWindow
      expect(@contentWindow.mocha).to.eq @mocha.mocha

    it "calls removeAllListeners on mocha.suite", ->
      removeAllListeners = @sandbox.spy @mocha.mocha.suite, "removeAllListeners"
      @mocha.set @contentWindow
      expect(removeAllListeners).to.be.calledOnce

    it "clones and redefines mocha.suites", ->
      oldSuite = @mocha.mocha.suite
      clone = @sandbox.spy oldSuite, "clone"
      @mocha.set @contentWindow
      expect(clone).to.be.calledOnce
      expect(@mocha.mocha.suite).not.to.eq oldSuite
      expect(@mocha.mocha.suite).to.be.instanceof Mocha.Suite

    it "calls ui with 'bdd'", ->
      ui = @sandbox.spy @mocha, "ui"
      @mocha.set @contentWindow
      expect(ui).to.be.calledWith @contentWindow, "bdd"

    context "#ui", ->
      it "emits pre-require on mocha.suite", ->
        @contentWindow.mocha = @mocha.mocha
        @mocha.clone @contentWindow

        emit = @sandbox.spy @contentWindow.mocha.suite, "emit"

        @mocha.ui @contentWindow, "bdd"

        expect(emit).to.be.calledWith "pre-require", @contentWindow, null, @contentWindow.mocha

  context "#stop", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    it "calls removeAllListeners from mocha suite", ->
      removeAllListeners = @sandbox.spy @mocha.mocha.suite, "removeAllListeners"
      @mocha.stop()
      expect(removeAllListeners).to.be.calledOnce

    it "nulls out mocha suite", ->
      mocha = @mocha.mocha
      @mocha.stop()
      expect(mocha.suite).to.be.null

    it "nulls out Cypress.mocha", ->
      expect(@mocha).to.be.ok
      @mocha.stop()
      expect(@Cypress.mocha).to.be.null

  context "#restore", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    it "calls #restoreRunnerRun", ->
      restoreRunnerRun = @sandbox.spy @mocha, "restoreRunnerRun"
      @mocha.restore()
      expect(restoreRunnerRun).to.be.calledOnce

    it "calls #restoreRunnerFail", ->
      restoreRunnerFail = @sandbox.spy @mocha, "restoreRunnerFail"
      @mocha.restore()
      expect(restoreRunnerFail).to.be.calledOnce

    it "calls #restoreRunnableRun", ->
      restoreRunnableRun = @sandbox.spy @mocha, "restoreRunnableRun"
      @mocha.restore()
      expect(restoreRunnableRun).to.be.calledOnce

    it "calls #restoreRunnableResetTimeout", ->
      restoreRunnableResetTimeout = @sandbox.spy @mocha, "restoreRunnableResetTimeout"
      @mocha.restore()
      expect(restoreRunnableResetTimeout).to.be.calledOnce

  context "#override", ->

  context "#patchRunnerRun", ->

  context "#patchRunnerFail", ->

  context "#patchRunnableRun", ->

  context "#patchRunnableResetTimeout", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)
      @mocha.restore()
      @mocha.patchRunnableResetTimeout()
      @t = new Mocha.Runnable
      @t.callback = @sandbox.stub()

    afterEach ->
      @t.clearTimeout()
      @mocha.restore()

    it "sets timer", ->
      @t.resetTimeout()
      expect(@t.timer).to.be.a("number")

    context "timer", ->
      it "sets setTimeout to default timeout ms of 2000", ->
        setTimeout = @sandbox.spy window, "setTimeout"
        @t.resetTimeout()
        expect(setTimeout.getCall(0).args[1]).to.eq 2000

      it "sets setTimeout to custom timeout ms of 5000", ->
        setTimeout = @sandbox.spy window, "setTimeout"
        @t.timeout(5000)
        @t.resetTimeout()
        expect(setTimeout.getCall(0).args[1]).to.eq 5000

      it "calls clearTimeout", ->
        clearTimeout = @sandbox.spy @t, "clearTimeout"
        @t.resetTimeout()
        expect(clearTimeout).to.be.calledOnce

    context "setTimeout", ->
      beforeEach ->
        @clock = @sandbox.useFakeTimers()

      it "sets timedOut to true", ->
        @t.resetTimeout()
        @clock.tick(2000)
        expect(@t.timedOut).to.be.true

      it "calls callback with error message when not async", ->
        @t.resetTimeout()
        @clock.tick(2000)
        err = @t.callback.getCall(0).args[0]
        expect(err.message).to.eq "Cypress command timeout of '2000ms' exceeded."

      it "calls callback with error message when async", ->
        @t.async = true
        @t.resetTimeout()
        @clock.tick(2000)
        err = @t.callback.getCall(0).args[0]
        expect(err.message).to.eq "Timed out after '2000ms'. The done() callback was never invoked!"

  context "#options", ->
    beforeEach ->
      @mocha = $Cypress.Mocha.create(@Cypress, @iframe)

    it "calls runner#options with mocha.options", ->
      runner = {options: @sandbox.spy()}
      @mocha.options(runner)
      expect(runner.options).to.be.calledWith @mocha.mocha.options

  context "integration", ->
    enterCommandTestingMode()

    describe "#override", ->
      beforeEach ->
        @mocha = $Cypress.Mocha.create(@Cypress, @iframe)
        @mocha.override()

      afterEach ->
        @mocha.restore()

      context "cy chain", ->
        beforeEach ->
          @chain = @cy.noop({foo: "foo"}).as("foo")

          ## simulate not returning cy from beforeEach
          return null

        it "forcibly returns cy chainer", ->
          ## foo should still be defined since
          ## the beforeEach should have waited
          ## for cy to complete!
          expect(@foo).to.deep.eq {foo: "foo"}

        ## FIXME: need new way to test this with cy.chain gone
        it.skip "does not create a new chainer", ->
          ## mocha will attach a .then() to the coerced
          ## return value from the override.  if we dont
          ## return the chain, then mocha will automatically
          ## create a new chainer by attaching this to cy.then()
          ## instead of the correct cy.chain().then()
          ## we can verify this by ensuring the last chain
          ## is what is carried over to the test
          expect(@chain.id).to.eq(@cy.chain().id)

        context "#patchRunnableRun", ->
          it "does not break async tests", (done) ->
            expect(done).to.be.a("function")
            done()

          it "does not break async tests with cy invoked", (done) ->
            @cy.noop({}).then ->
              expect(done).to.be.a("function")
              done()
