describe "Runner API", ->
  before ->
    Cypress.init({})
    Cypress.Chai.restore()
    Cypress.Mocha.restore()

  after ->
    Cypress.stop()

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

    # it.only "sets test if exists in hook.ctx.currentTest", (done) ->
    #   Cypress.on "test:before:hooks", (test) ->
    #     expect(test.title).to.eq "two"
    #     done()

    #   @runner.grep /two/
    #   @runner.runner.run ->

      # @runner.getTestFromHook

  context "#patchHookEvents", ->
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

    afterEach ->
      Cypress.off "test:before:hooks"
      Cypress.off "test:after:hooks"

    it "has 13 tests", ->
      expect(@runner.runner.total).to.eq 13

    it "restores Cypress between each test", (done) ->
      ## we have 13 tests, so 13 restore's should happen!
      restore = @sandbox.spy Cypress, "restore"
      @runner.runner.run ->
        expect(restore.callCount).to.eq 13

    it "beforeAll triggers test:before:hook event once on the root suite", (done) ->
      ## 1 event should be triggered here because we only have 1 root suite
      events = []

      Cypress.on "test:before:hooks", (hook, suite) ->
        events.push({hook: hook, suite: suite})

      @runner.runner.run ->
        expect(events).to.have.length(1)
        done()

    it "beforeEach triggers test:before:hook", (done) ->
      ## 1 event should be triggered here because we only have 1 root suite
      events = []

      Cypress.on "test:before:hooks", (hook, suite) ->
        events.push({hook: hook, suite: suite})

      debugger
      @runner.runner.run ->
        expect(events).to.have.length(1)
        done()

    describe.only "when grepped", ->
      it "triggers test:before:hooks on test 'two'", (done) ->
        Cypress.on "test:before:hooks", (test) ->
          expect(test.title).to.eq "two"
          done()

        @runner.grep /two/
        @runner.getRunnables()
        @runner.runner.run()

      it "triggers test:before:hooks on test 'ten'", (done) ->
        Cypress.on "test:before:hooks", (test) ->
          expect(test.title).to.eq "suite 4, ten"
          done()

        @runner.grep /ten/
        @runner.getRunnables()
        @runner.runner.run()

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

        grep = /.*/
        test = @sandbox.spy grep, "test"

        @runner.getRunnables({grep: grep})

        ## we have 4 tests, thats how many should have been grepp'd!
        expect(test.callCount).to.eq 4

      it "regreps the tests if grep has changed between iterations", ->
        @runner.runnables = []

        grep = @runner.grep()
        test = @sandbox.spy @runner.runner._grep, "test"
        @runner.getRunnables()

        grep2 = @runner.grep /.+/
        test2 = @sandbox.spy @runner.runner._grep, "test"
        @runner.getRunnables()

        ## should grep each of the tests twice
        expect(test.callCount + test2.callCount).to.eq 8

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
