describe "Runner API", ->
  before ->
    Cypress.init({})
    Cypress.Chai.restore()
    Cypress.Mocha.restore()

    ## maybe instead of backing these up manually
    ## we can just clone all of the existing events
    ## then remove them and restore after?
    ## backup these existing events
    @testBeforeHooks = Cypress.removeEvents("test:before:hooks")

    ## allow our own cypress errors to bubble up!
    App.Utilities.Overrides.overloadMochaRunnerUncaught()

  after ->
    ## restore existing events
    Cypress.setEvents(@testBeforeHooks)
    Cypress.stop()
    App.Utilities.Overrides.restore()

  context "interface", ->
    it "returns runner instance", ->
      r = Cypress.Runner.runner({})
      expect(r).to.be.instanceof Cypress.Runner

    it ".getRunner errors without a runner", ->
      expect(Cypress.getRunner).to.throw "Cypress._runner instance not found!"

    it ".getRunner returns runner instance", ->
      r = Cypress.Runner.runner({})
      expect(Cypress.getRunner()).to.eq r

  context "Cypress events", ->
    beforeEach ->
      @runner = Cypress.Runner.runner({})

    it "fail", ->
      fail = @sandbox.stub @runner, "fail"
      Cypress.trigger "fail"
      expect(fail).to.be.calledOnce

    it "abort", ->
      abort = @sandbox.stub @runner, "abort"
      Cypress.trigger "abort"
      expect(abort).to.be.calledOnce

    it "destroy", ->
      destroy = @sandbox.stub @runner, "destroy"
      Cypress.trigger "destroy"
      expect(destroy).to.be.calledOnce
      expect(Cypress.getRunner).to.throw

  context "#setListeners", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["one"]
      @runner = Cypress.Runner.runner(runner)
      @runner.setListeners()
      @trigger = @sandbox.spy Cypress, "trigger"

    describe "runner.on('start')", ->
      it "Cypress triggers run:start", (done) ->
        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "run:start"
          done()

    describe "runner.on('end')", ->
      it "Cypress triggers run:end", (done) ->
        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "run:end"
          done()

      it "calls #destroy", (done) ->
        destroy = @sandbox.spy @runner, "destroy"

        @runner.runner.run =>
          expect(destroy).to.be.called
          done()

    describe "runner.on('suite')", ->
      it "Cypress triggers suite:start", (done) ->
        @runner.runner.on "suite", (@suite) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "suite:start", @suite
          done()

    describe "runner.on('suite end')", ->
      it "Cypress triggers suite:end", (done) ->
        @runner.runner.on "suite end", (@suite) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "suite:end", @suite
          done()

    describe "runner.on('hook')", ->
      it "Cypress triggers hook:start", (done) ->
        @runner.runner.on "hook", (@hook) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "hook:start", @hook
          done()

      it "calls Cypress.set with the test + hookName", (done) ->
        set = @sandbox.spy Cypress, "set"

        @runner.runner.on "hook", (hook) ->
          expect(set).to.be.calledWith hook, "before each"
          done()

        @runner.runner.run()

      it "sets hook.id to associated test.id", (done) ->
        test = @runner.getTestByTitle("one")
        test.id = 123

        @runner.runner.on "hook", (@hook) =>
          expect(@hook.id).to.eq 123
          done()

        @runner.runner.run()

      it "sets hook.id to associated test.id given multiple grepp'd tests", (done) ->
        runner = Fixtures.createRunnables
          hooks: ["beforeEach"]
          tests: ["one"]
          suites:
            "suite 1":
              hooks: ["beforeAll"]
              tests: ["two"]

        runner = Cypress.Runner.runner(runner)
        runner.setListeners()

        test    = runner.getTestByTitle "two"
        test.id = "a0e"
        hook    = runner.runner.suite.suites[0]._beforeAll[0]

        runner.runner.run =>
          expect(hook.id).to.eq("a0e")
          done()

    describe "runner.on('hook end')", ->
      it "Cypress triggers hook:end", (done) ->
        @runner.runner.on "hook end", (@hook) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "hook:end", @hook
          done()

      it "does not call Cypress.set if hook isnt before each", (done) ->
        runner = Fixtures.createRunnables
          hooks: ["beforeAll", "afterEach", "afterAll"]
          tests: ["one"]
        runner = Cypress.Runner.runner(runner)
        runner.setListeners()

        test = runner.getTestByTitle "one"
        set = @sandbox.spy Cypress, "set"

        runner.runner.run ->
          expect(set).to.be.calledWith test
          done()

      it "calls Cypress.set with the test + hookName if hook is before each", (done) ->
        set = @sandbox.spy Cypress, "set"

        @runner.runner.on "hook end", (@hook) =>

        ## we expect 3 calls here
        ## 1 hook (beforeEach)
        ## 1 test
        ## 1 test (on hook end - for the beforeEach)
        @runner.runner.run =>
          expect(set.callCount).to.eq 3
          expect(set.thirdCall).to.be.calledWith @hook.ctx.test, "test"
          done()

    describe "runner.on('test')", ->
      it "Cypress triggers test:start", (done) ->
        @runner.runner.on "test", (@test) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "test:start", @test
          done()

      it "sets this.test", (done) ->
        @runner.runner.on "test", (test) =>
          expect(@runner.test).to.eq test
          done()

        @runner.runner.run()

      it "calls Cypress.set with the test + hookName", (done) ->
        set = @sandbox.spy Cypress, "set"

        @runner.runner.on "test", (test) ->
          expect(set).to.be.calledWith test, "test"
          done()

        @runner.runner.run()

    describe "runner.on('test end')", ->
      it "Cypress triggers test:end", (done) ->
        @runner.runner.on "test", (@test) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "test:end", @test
          done()

    describe "runner.on('pending')", ->
      it "emits test with test", (done) ->
        test = @runner.getTestByTitle("one")
        test.pending = true

        @runner.runner.on "pending", (@test) =>

        @runner.runner.run =>
          expect(@trigger).to.be.calledWith "test:start", @test
          done()

    describe "runner.on('fail')", ->
      it "sets err on runnable", (done) ->
        err = new Error("err!")
        test = @runner.getTestByTitle("one")
        test.fn = ->
          throw err

        @runner.runner.run ->
          expect(test.err).to.eq err
          done()

      it "calls hookFailed if test.type is hook", (done) ->
        hookFailed = @sandbox.stub @runner, "hookFailed"

        err = new Error("err!")
        hook = @runner.runner.suite._beforeEach[0]
        hook.fn = ->
          throw err

        @runner.runner.run ->
          expect(hookFailed).to.be.calledWith
          done()

  context "#hookFailed", ->
    beforeEach (done) ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["one"]

      @runner = Cypress.Runner.runner(runner)
      @runner.setListeners()

      @hook = @runner.runner.suite._beforeEach[0]
      @hook.fn = ->
        throw new Error("hook failed!")

      @runner.runner.on "test end", (test) ->
        ## this should never fire
        ## else we would receive 2 test:end events
        done(test)

      ## we're additionally testing that Cypress
      ## fires this test:end event since thats
      ## how we actually get our test!
      Cypress.on "test:end", (@relatedTest) =>

      @runner.runner.run -> done()

    afterEach ->
      Cypress.off "test:end"

    it "sets test err to hook err", ->
      expect(@relatedTest.err).to.eq @hook.err

    it "sets test state to failed", ->
      expect(@relatedTest.state).to.eq "failed"

    it "sets test duration to hook duration", ->
      expect(@relatedTest.duration).to.eq @hook.duration

    it "sets test hook to hook", ->
      expect(@relatedTest.hookName).to.eq "before each"

    it "sets test failedFromHook", ->
      expect(@relatedTest.failedFromHook).to.be.true

  context "#constructor", ->
    it "stores mocha runner instance", ->
      r = Cypress.Runner.runner({})
      expect(r.runner).to.deep.eq({})

    it "stores runnables array", ->
      r = Cypress.Runner.runner({})
      expect(r.runnables).to.deep.eq []

  context "#getTestFromHook", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        tests: ["one", "two", "three"]
        suites:
          "suite 1":
            tests: ["suite 1, four", "suite 1, five", "suite 1, six"]
            suites:
              "suite 2":
                tests: ["suite 2, seven"]
                suites:
                  "suite 3":
                    tests: ["suite 3, eight"]
                  "suite 4":
                    tests: ["suite 4, nine", "suite 4, ten"]
                    suites:
                      "suite 5":
                        tests: ["suite 5, eleven", "suite 5, twelve"]
          "suite 7":
            tests: ["suite 7, thirteen"]

      @runner = Cypress.Runner.runner(runner)
      @runner.setListeners()

    it "gets first test during initial root suite with undefined hook", ->
      ## when our first beforeAll fires, hook is undefined and our
      ## suite is the root suite
      ## this should return test "one"
      test = @runner.getTestFromHook undefined, @runner.runner.suite
      expect(test.title).to.eq "one"

  context "#patchHookEvents", ->
    afterEach ->
      Cypress.off "test:before:hooks"
      Cypress.off "test:after:hooks"

    describe "many tests", ->
      beforeEach ->
        runner = Fixtures.createRunnables
          tests: ["one", "two", "three"]
          suites:
            "suite 1":
              tests: ["suite 1, four", "suite 1, five", "suite 1, six"]
              suites:
                "suite 2":
                  tests: ["suite 2, seven"]
                  suites:
                    "suite 3":
                      tests: ["suite 3, eight"]
                    "suite 4":
                      tests: ["suite 4, nine", "suite 4, ten"]
                      suites:
                        "suite 5":
                          tests: ["suite 5, eleven", "suite 5, twelve"]
            "suite 7":
              tests: ["suite 7, thirteen"]

        @runner = Cypress.Runner.runner(runner)

      it "has 13 tests", ->
        expect(@runner.runner.total).to.eq 13

      it "triggers 'test:after:hooks' two times", (done) ->
        runner = Fixtures.createRunnables
          tests: ["one", "two"]

        @runner = Cypress.Runner.runner(runner)

        trigger = @sandbox.spy Cypress, "trigger"

        @runner.runner.run ->
          calls = _(trigger.getCalls()).filter (call) -> call.args[0] is "test:after:hooks"
          expect(calls.length).to.eq(2)
          done()

      it "restores Cypress between each test", (done) ->
        ## we have 13 tests, so 13 restore's should happen!
        restore = @sandbox.spy Cypress, "restore"
        @runner.runner.run ->
          expect(restore.callCount).to.eq 13
          done()

      describe "when grepped", ->
        it "triggers test:before:hooks on test 'two'", (done) ->
          Cypress.on "test:before:hooks", (@curTest) =>

          @runner.grep /two/
          @runner.getRunnables()
          @runner.runner.run =>
            expect(@curTest.title).to.eq "two"
            done()

        it "triggers test:before:hooks on test 'ten'", (done) ->
          Cypress.on "test:before:hooks", (@curTest) =>

          @runner.grep /ten/
          @runner.getRunnables()
          @runner.runner.run =>
            expect(@curTest.title).to.eq "suite 4, ten"
            done()

    describe "one test", ->
      beforeEach ->
        runner = Fixtures.createRunnables
          tests: ["one"]

        @runner = Cypress.Runner.runner(runner)

      it "null out test", (done) ->
        Cypress.on "test:after:hooks", (test) =>
          expect(@runner.test).to.be.null
          done()

        @runner.runner.run()

      it "calls Cypress.restore()", (done) ->
        restore = @sandbox.spy Cypress, "restore"

        @runner.runner.run ->
          expect(restore).to.be.calledOnce
          done()

      it "triggers 'test:after:hooks' with the test", (done) ->
        Cypress.on "test:after:hooks", (test) =>
          expect(test).to.eq @runner.getTestByTitle "one"
          done()

        @runner.runner.run()

      it "triggers 'test:after:hooks' only once", (done) ->
        trigger = @sandbox.spy Cypress, "trigger"

        @runner.runner.run ->
          calls = _(trigger.getCalls()).filter (call) -> call.args[0] is "test:after:hooks"
          expect(calls).to.have.length(1)
          done()

  context "#grep", ->
    beforeEach ->
      @runner = Cypress.Runner.runner({})

    it "set /.*/ by default", ->
      @runner.grep()
      expect(@runner.runner._grep).to.match /.*/

    it "can set to another RegExp", ->
      re = /.+/
      @runner.grep(re)

      expect(@runner.runner._grep).to.eq re

  context "#anyTest", ->
    beforeEach ->
      runner = Fixtures.createRunnables {
        tests: ["root test 1"]
        suites: {
          "suite 1": {
            tests: ["suite 1, test 1", "suite 1, test 2"]
            suites: {
              "suite 2": {
                tests: ["suite 2, test 1"]
              }
            }
          }
        }
      }

      @runner = Cypress.Runner.runner(runner)

    it "iterates through all of the tests of a suite", ->
      tests = []

      ## start from the root suite
      @runner.anyTest @runner.runner.suite, (test) ->
        tests.push(test)

      allTests = _(tests).all (test) -> test.type is "test"
      expect(allTests).to.be.true
      expect(tests).to.have.length(4)

    it "can bail by returning true", ->
      iterator = @sandbox.spy _.after 2, ->
        ## return early by returning true after
        ## the second invocation
        return true

      @runner.anyTest @runner.runner.suite, iterator

      expect(iterator.callCount).to.eq(2)

    it "returns true if any iterator returns true", ->
      iterator = _.after 2, -> return true

      ret = @runner.anyTest @runner.runner.suite, iterator
      expect(ret).to.be.true

    it "returns false if not any iterator returns true", ->
      iterator = -> return false

      ret = @runner.anyTest @runner.runner.suite, iterator
      expect(ret).to.be.false

  context "#getRunnables", ->
    beforeEach ->
      runner = Fixtures.createRunnables {
        tests: ["one"]
        suites: {
          "suite 1": {
            tests: ["suite 1, two", "suite 1, three"]
            suites: {
              "suite 2": {
                tests: ["suite 2, four"]
              }
            }
          }
        }
      }

      @runner = Cypress.Runner.runner(runner)

    it "pushes runnable into runnables array", ->
      ## 2 suites + 4 tests = 6 total
      expect(@runner.runnables).to.have.length(6)

    it "pushes tests into tests array", ->
      ## 4 tests
      expect(@runner.tests).to.have.length(4)

    it "only pushes matching grep tests", ->
      ## with 4 existing tests
      expect(@runner.tests).to.have.length(4)

      @runner.grep(/four/)

      @runner.getRunnables()

      ## only 1 test should have matched the grep
      expect(@runner.tests).to.have.length(1)

    it "sets runnable type", ->
      types = _.pluck @runner.runnables, "type"
      expect(types).to.deep.eq ["test", "suite", "test", "test", "suite", "test"]

    it "calls options.onRunnable", ->
      runnables = []

      @runner.getRunnables
        onRunnable: (runnable) ->
          runnables.push(runnable)

      expect(runnables.length).to.eq(6)

    it "does not call options.onRunnable if no test in a suite matches grep", ->
      runnables = []

      @runner.getRunnables
        onRunnable: (runnable) ->
          runnables.push(runnable)
        grep: /four/

      titles = _(runnables).pluck "title"

      expect(titles).to.deep.eq [
        "suite 1", "suite 2", "suite 2, four"
      ]

    it "prefers .runnables on subsequent iterations", ->
      ## grab the top 4 runnables
      @runner.runnables = @runner.runnables.slice(0, 4)

      runnables = []

      @runner.getRunnables
        onRunnable: (runnable) ->
          runnables.push(runnable)

      expect(runnables).to.have.length(4)

    context "runnable optimizations", ->
      beforeEach ->
        ## make sure we reset our runnables
        ## so it appears as if this is a clean
        ## run!
        @runner.runnables = []

      it "never invokes #iterateThroughRunnables", ->
        @runner.runnables = []
        @runner.getRunnables()
        iterateThroughRunnables = @sandbox.spy @runner, "iterateThroughRunnables"
        @runner.getRunnables()
        expect(iterateThroughRunnables).not.to.be.called

      it "does not continue to push into .runnables or mutate them", ->
        @runner.runnables = []
        @runner.getRunnables()
        runnables = @runner.runnables
        expect(runnables).to.have.length(6)
        @runner.getRunnables()
        expect(@runner.runnables).to.have.length(6)
        expect(@runner.runnables).to.eq(runnables)

      it "only tests the grep once for each test runnable", ->
        @runner.runnables = []

        grep = /\w+/
        test = @sandbox.spy grep, "test"

        @runner.getRunnables({grep: grep})

        ## we have 4 tests, thats how many should have been grepp'd!
        expect(test.callCount).to.eq 4

      it "regreps the tests if grep has changed between iterations", ->
        @runner.runnables = []

        grep = @runner.grep /\w+/
        test = @sandbox.spy @runner.runner._grep, "test"
        @runner.getRunnables()

        grep2 = @runner.grep /.+/
        test2 = @sandbox.spy @runner.runner._grep, "test"
        @runner.getRunnables()

        ## should grep each of the tests twice
        expect(test.callCount + test2.callCount).to.eq 8

  context "#destroy", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["root test 1", "root test 2"]
        suites:
          "suite 1":
            tests: ["suite 1, test 1", "suite 1, test 2"]
          "suite 2":
            tests: ["suite 2, test 1"]

      @runner = Cypress.Runner.runner(runner)

    it "unbinds runnables", (done) ->
      @runner.runner.on "end", =>
        @removeAllListeners = _.map @runner.runnables, (r) =>
          @sandbox.spy r, "removeAllListeners"

      @runner.setListeners()

      @runner.runner.run =>
        _.each @removeAllListeners, (r) ->
          expect(r).to.be.calledOnce
        done()

    it "unbinds runner", (done) ->
      @runner.runner.on "end", =>
        @removeAllListeners = @sandbox.spy @runner.runner, "removeAllListeners"

      @runner.setListeners()

      @runner.runner.run =>
        expect(@removeAllListeners).to.be.calledOnce
        done()

    it "resets runnables", (done) ->
      @runner.setListeners()

      @runner.runner.run =>
        expect(@runner.runnables).to.deep.eq []
        done()

  context "#abort", ->
    beforeEach ->
      runner = Fixtures.createRunnables {
        tests: ["root test 1", "root test 2"]
        suites: {
          "suite 1": {
            tests: ["suite 1, test 1", "suite 1, test 2"]
          }
          "suite 2": {
            tests: ["suite 2, test 1"]
          }
        }
      }

      @runner = Cypress.Runner.runner(runner)

    afterEach ->
      @runner.runner.removeAllListeners()

    it "aborts the mocha runner", ->
      abort = @sandbox.spy @runner.runner, "abort"
      @runner.abort()
      expect(abort).to.be.calledOnce

    ## this is testing mocha functionality but
    ## we essentially need this for regression
    ## tests for mocha upgrades
    ## mocha has NO tests surrounding .abort()
    it "does not run additional tests", (done) ->
      ## we have 5 tests total
      tests = []

      @runner.runner.on "test", (test) =>
        tests.push(test)
        ## we abort after the 3rd test
        if test.title is "suite 1, test 1"
          @runner.abort()

      @runner.runner.run ->
        ## so we didnt run 2, and should only
        ## have run 3 tests!
        expect(tests).to.have.length(3)
        done()
