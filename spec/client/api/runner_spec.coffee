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
      @runner.getRunnables()
      expect(@runner.runnables).to.have.length(6)

    it "sets runnable type", ->
      @runner.getRunnables()
      types = _.pluck @runner.runnables, "type"
      expect(types).to.deep.eq ["test", "suite", "test", "test", "suite", "test"]

    it "sets runnable.added", ->
      allAdded = _(@runnable.runnables).all (runnable) -> runnable.added is true
      expect(allAdded).to.be.true

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
