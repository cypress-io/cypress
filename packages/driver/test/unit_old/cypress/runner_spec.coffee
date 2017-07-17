{ _ } = window.testUtils

describe "$Cypress.Runner API", ->
  beforeEach ->
    @Cypress = $Cypress.create()
    @Cypress.setConfig({numTestsKeptInMemory: 50, isHeadless: true})

  context ".create", ->

  context ".runner", ->
    it "assigns new runner instance to Cypress.runner", ->
      $Cypress.Runner.runner(@Cypress, {})
      expect(@Cypress.runner).to.be.instanceof $Cypress.Runner

  context "#constructor", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})

    it "sets runner property", ->
      expect(@runner.runner).to.deep.eq {}

    it "stores runnables array", ->
      expect(@runner.runnables).to.deep.eq []

  context "#listeners", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})

    it "fail", ->
      fail = @sandbox.stub @runner, "fail"
      @Cypress.trigger "fail"
      expect(fail).to.be.calledOnce

    it "abort", ->
      abort = @sandbox.stub @runner, "abort"
      @Cypress.trigger "abort"
      expect(abort).to.be.calledOnce

    it "stop", ->
      stop = @sandbox.stub @runner, "stop"
      @Cypress.trigger "stop"
      expect(stop).to.be.calledOnce

    it "unbinds previous runner listeners on Cypress", ->
      totalEvents = =>
        _.reduce @Cypress._events, (memo, value, key) ->
          memo += value.length
        , 0

      count = totalEvents()

      ## after instantiating another runner
      $Cypress.Runner.runner(@Cypress, {})

      ## we shouldn't have any additional events
      expect(totalEvents()).not.to.be.gt count

  context "#runnerListeners", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["one"]
      @runner = $Cypress.Runner.runner(@Cypress, runner)
      @trigger = @sandbox.spy @Cypress, "trigger"

    describe "runner.on('start')", ->
      it "Cypress triggers run:start", (done) ->
        @runner.run =>
          expect(@trigger).to.be.calledWith "run:start"
          done()

    describe "runner.on('end')", ->
      it "Cypress triggers run:end", (done) ->
        @runner.run =>
          expect(@trigger).to.be.calledWith "run:end"
          done()

      it "calls #restore", (done) ->
        restore = @sandbox.spy @runner, "restore"

        @runner.run =>
          expect(restore).to.be.called
          done()

      it "calls test:after:hooks and test:after:run when uncaught err from hook", (done) ->
        fn = _.after 3, -> done()

        @Cypress.on "test:after:hooks", (test) ->
          expect(test.title).to.eq("one")
          fn()

        @Cypress.on "test:after:run", (test) ->
          expect(test.title).to.eq("one")
          fn()

        @Cypress.on "run:end", -> fn()

        beforeEach = @runner.runner.suite._beforeEach[0]
        beforeEach.fn = =>
          @runner.runner.uncaught(new Error("this is uncaught!"))

        @runner.run =>

    ## FIXME
    describe.skip "runner.on('suite')", ->
      it "Cypress triggers suite", (done) ->
        @runner.runner.on "suite", (@suite) =>

        @runner.run =>
          expect(@trigger).to.be.calledWith "mocha", "suite", @runner.wrap(@suite)
          done()

    ## FIXME
    describe.skip "runner.on('suite end')", ->
      it "Cypress triggers suite:end", (done) ->
        @runner.runner.on "suite end", (@suite) =>

        @runner.run =>
          expect(@trigger).to.be.calledWith "mocha", "suite end", @runner.wrap(@suite)
          done()

    describe "runner.on('hook')", ->
      ## FIXME
      it.skip "Cypress triggers hook:start", (done) ->
        @runner.runner.on "hook", (@hook) =>

        @runner.run =>
          expect(@trigger).to.be.calledWithMatch "mocha", "hook", @runner.wrap(@hook)
          done()

      it "calls Cypress.set with the test + hookName", (done) ->
        set = @sandbox.spy @Cypress, "set"

        @runner.runner.on "hook", (@hook) =>

        @runner.run =>
          expect(set).to.be.calledWith @hook, "before each"
          done()

      it "sets hook.id to associated test.id", (done) ->
        test = @runner.getTestByTitle("one")
        test.id = 123

        @runner.runner.on "hook", (@hook) =>

        @runner.run =>
          expect(@hook.id).to.eq 123
          done()

      it "sets hook.id to associated test.id given multiple grepp'd tests", (done) ->
        runner = Fixtures.createRunnables
          hooks: ["beforeEach"]
          tests: ["one"]
          suites:
            "suite 1":
              hooks: ["beforeAll"]
              tests: ["two"]

        runner = $Cypress.Runner.runner(@Cypress, runner)

        test    = runner.getTestByTitle "two"
        test.id = "a0e"
        hook    = runner.runner.suite.suites[0]._beforeAll[0]

        runner.run =>
          expect(hook.id).to.eq("a0e")
          done()

    describe "runner.on('hook end')", ->
      ## FIXME
      it.skip "Cypress triggers hook:end", (done) ->
        @runner.runner.on "hook end", (@hook) =>

        @runner.run =>
          expect(@trigger).to.be.calledWithMatch "mocha", "hook end", @runner.wrap(@hook)
          done()

      it "does not call Cypress.set if hook isnt before each", (done) ->
        runner = Fixtures.createRunnables
          hooks: ["beforeAll", "afterEach", "afterAll"]
          tests: ["one"]
        runner = $Cypress.Runner.runner(@Cypress, runner)

        test = runner.getTestByTitle "one"
        set = @sandbox.spy @Cypress, "set"

        runner.run ->
          expect(set).to.be.calledWith test
          done()

      it "calls Cypress.set with the test + hookName if hook is before each", (done) ->
        set = @sandbox.spy @Cypress, "set"

        @runner.runner.on "hook end", (@hook) =>
          ## preserve the test now because
          ## our suite will nuke the ctx later
          @test = @hook.ctx.currentTest

        ## we expect 3 calls here
        ## 1 hook (beforeEach)
        ## 1 test
        ## 1 test (on hook end - for the beforeEach)
        @runner.run =>
          expect(set.callCount).to.eq 3
          expect(set.thirdCall).to.be.calledWith @test, "test"
          done()

    describe "runner.on('test')", ->
      ## FIXME
      it.skip "Cypress triggers test:start", (done) ->
        @runner.runner.on "test", (@test) =>

        @runner.run =>
          expect(@trigger).to.be.calledWithMatch "mocha", "test", @runner.wrap(@test)
          done()

      it "sets this.test", (done) ->
        @runner.runnerListeners()

        @runner.runner.on "test", (@test) =>
          expect(@runner.test).to.eq @test

        @runner.run -> done()

      it "calls Cypress.set with the test + hookName", (done) ->
        set = @sandbox.spy @Cypress, "set"

        @runner.runner.on "test", (@test) =>

        @runner.run =>
          expect(set).to.be.calledWith @test, "test"
          done()

    ## FIXME
    describe.skip "runner.on('test end')", ->
      it "Cypress triggers test:end", (done) ->
        @runner.runner.on "test", (@test) =>

        @runner.run =>
          expect(@trigger).to.be.calledWithMatch "mocha", "test end", @runner.wrap(@test)
          done()

    ## FIXME
    describe.skip "runner.on('pending')", ->
      it "emits test with test", (done) ->
        test = @runner.getTestByTitle("one")
        test.pending = true

        @runner.runner.on "pending", (@test) =>

        @runner.run =>
          expect(@trigger).to.be.calledWithMatch "mocha", "test", @runner.wrap(@test)
          done()

    describe "runner.on('fail')", ->
      it "sets err on runnable", (done) ->
        err = new Error("err!")
        test = @runner.getTestByTitle("one")
        test.fn = ->
          throw err

        @runner.run ->
          expect(test.err.message).to.eq err.message
          expect(test.err.name).to.eq err.name
          expect(test.err.stack).to.eq err.stack
          done()

      it "calls hookFailed if test.type is hook", (done) ->
        hookFailed = @sandbox.stub @runner, "hookFailed"

        err = new Error("err!")
        hook = @runner.runner.suite._beforeEach[0]
        hook.fn = ->
          throw err

        @runner.run ->
          expect(hookFailed).to.be.calledWith
          done()

  context "#getHookName", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})
      @hook = {title: '"before each" hook for "t2a"'}

    it "matches only the first quotes", ->
      expect(@runner.getHookName(@hook)).to.eq("before each")

  context "#hookFailed", ->
    beforeEach (done) ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["one"]

      @runner = $Cypress.Runner.runner(@Cypress, runner)

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
      @Cypress.on "test:after:run", (@relatedTest) =>

      @runner.run -> done()

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

      @runner = $Cypress.Runner.runner(@Cypress, runner)

    it "gets first test during initial root suite with undefined hook", ->
      ## when our first beforeAll fires, hook is undefined and our
      ## suite is the root suite
      ## this should return test "one"
      test = @runner.getTestFromHook undefined, @runner.runner.suite
      expect(test.title).to.eq "one"

  context "#override", ->
    describe "a few tests", ->
      beforeEach ->
        runner = Fixtures.createRunnables
          suites:
            "suite 1":
              tests: ["suite 1, one"]
            "suite 2":
              hooks: ["beforeAll"]
              tests: ["suite 2, two"]

        @runner = $Cypress.Runner.runner(@Cypress, runner)

      it "fires test:before:run:async twice", (done) ->
        invoke = @sandbox.spy @Cypress, "invoke"

        @runner.run ->
          calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:before:run:async"
          expect(calls.length).to.eq(2)
          done()

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

        @runner = $Cypress.Runner.runner(@Cypress, runner)

      it "has 13 tests", ->
        expect(@runner.runner.total).to.eq 13

      it "triggers 'test:after:hooks' two times", (done) ->
        runner = Fixtures.createRunnables
          tests: ["one", "two"]

        @runner = $Cypress.Runner.runner(@Cypress, runner)

        invoke = @sandbox.stub(@Cypress, "invoke").returns([])

        @runner.run ->
          calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:after:hooks"
          expect(calls.length).to.eq(2)
          done()

      it "restores Cypress between each test", (done) ->
        ## we have 13 tests, so 13 restore's should happen!
        restore = @sandbox.spy @Cypress, "restore"
        @runner.run ->
          expect(restore.callCount).to.eq 13
          done()

      describe "when grepped", ->
        it "triggers test:before:run:async on test 'two'", (done) ->
          @Cypress.on "test:before:run:async", (@curTest) =>

          @runner.grep /two/
          @runner.normalizeAll()
          @runner.run =>
            expect(@curTest.title).to.eq "two"
            done()

        it "triggers test:before:run:async on test 'ten'", (done) ->
          @Cypress.on "test:before:run:async", (@curTest) =>

          @runner.grep /ten/
          @runner.normalizeAll()
          @runner.run =>
            expect(@curTest.title).to.eq "suite 4, ten"
            done()

      describe "pending tests", ->
        context "2 pending tests", ->
          beforeEach ->
            runner = Fixtures.createRunnables
              tests: [
                {name: "one", pending: true}
                {name: "two", pending: true}
              ]

            @runner = $Cypress.Runner.runner(@Cypress, runner)

          it "fires test:before:run:async twice", (done) ->
            trigger = @sandbox.spy(@Cypress, "trigger")

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              expect(calls.length).to.eq(2)
              done()

          it "fires test:after:run twice", (done) ->
            trigger = @sandbox.stub(@Cypress, "trigger").returns([])

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:after:run"
              expect(calls.length).to.eq(2)
              done()

          ## only once because before(fn) code still gets executed  on pending tests
          it "fires test:before:run:async once", (done) ->
            invoke = @sandbox.spy(@Cypress, "invoke")

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              expect(calls.length).to.eq(1)
              done()

          ## only once because after(fn) code still gets executed on pending tests
          it "fires test:after:hooks once", (done) ->
            invoke = @sandbox.stub(@Cypress, "invoke").returns([])

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:after:hooks"
              expect(calls.length).to.eq(1)
              done()

        context "1 pending test as a sandwich", ->
          beforeEach ->
            runner = Fixtures.createRunnables
              tests: [
                "one"
                {name: "two", pending: true}
                "three"
              ]

            @runner = $Cypress.Runner.runner(@Cypress, runner)

          it "fires test:before:run:async thrice", (done) ->
            trigger = @sandbox.spy(@Cypress, "trigger")

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              expect(calls.length).to.eq(3)
              done()

          it "fires test:after:hooks thrice", (done) ->
            trigger = @sandbox.stub(@Cypress, "trigger").returns([])

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:after:run"
              expect(calls.length).to.eq(3)
              done()

          ## only twice because pending tests in the middle are completely skipped
          it "fires test:before:run:async twice", (done) ->
            invoke = @sandbox.spy(@Cypress, "invoke")

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              expect(calls.length).to.eq(2)
              done()

          ## only twice because pending tests in the middle are completely skipped
          it "fires test:after:hooks twice", (done) ->
            invoke = @sandbox.stub(@Cypress, "invoke").returns([])

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:after:hooks"
              expect(calls.length).to.eq(2)
              done()

        context "pending tests with non-pending tests after", ->
          beforeEach ->
            runner = Fixtures.createRunnables
              tests: [
                {name: "one", pending: true}
                "two"
              ]
              suites:
                "suite 1":
                  tests: ["three", {name: "four", pending: true} ]
                "suite 2":
                  tests: ["five"]

            @runner = $Cypress.Runner.runner(@Cypress, runner)

          it "fires test:before:run:async five times", (done) ->
            trigger = @sandbox.spy(@Cypress, "trigger")

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              expect(calls.length).to.eq(5)
              done()

          it "fires test:after:hooks five times", (done) ->
            trigger = @sandbox.stub(@Cypress, "trigger").returns([])

            @runner.run ->
              calls = _.filter trigger.getCalls(), (call) -> call.args[0] is "test:after:run"
              expect(calls.length).to.eq(5)
              done()

          it "fires test:before:run:async four times", (done) ->
            invoke = @sandbox.spy(@Cypress, "invoke")

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:before:run:async"
              titles = _.map calls, (call) -> call.args[1].title
              expect(calls.length).to.eq(4)

              ## this may seem strange but it is correct. only pending tests
              ## on the book ends will get their test:before:run:async called since
              ## thats the only time code can actually run on a pending test
              expect(titles).to.deep.eq(["one", "two", "three", "five"])
              done()

          ## only twice because pending tests in the middle are completely skipped
          it "fires test:after:hooks four times", (done) ->
            invoke = @sandbox.stub(@Cypress, "invoke").returns([])

            @runner.run ->
              calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:after:hooks"
              titles = _.map calls, (call) -> call.args[1].title

              ## this may seem strange but it is correct. only pending tests
              ## on the book ends will get their test:after:hooks called since
              ## thats the only time code can actually run on a pending test
              expect(calls.length).to.eq(4)
              expect(titles).to.deep.eq(["two", "three", "four", "five"])
              done()

    describe "one test", ->
      beforeEach ->
        runner = Fixtures.createRunnables
          tests: ["one"]

        @runner = $Cypress.Runner.runner(@Cypress, runner)

      it "null out test", (done) ->
        @Cypress.on "test:after:hooks", (test) =>
          expect(@runner.test).to.be.null
          done()

        @runner.run()

      it "calls Cypress.restore()", (done) ->
        restore = @sandbox.spy @Cypress, "restore"

        @runner.run ->
          expect(restore).to.be.calledOnce
          done()

      it "triggers 'test:after:hooks' with the test", (done) ->
        @Cypress.on "test:after:hooks", (test) =>
          expect(test).to.deep.eq @runner.wrap(@runner.getTestByTitle("one"))
          done()

        @runner.run()

      it "triggers 'test:after:hooks' only once", (done) ->
        invoke = @sandbox.stub(@Cypress, "invoke").returns([])

        @runner.run ->
          calls = _.filter invoke.getCalls(), (call) -> call.args[0] is "test:after:hooks"
          expect(calls).to.have.length(1)
          done()

  context "#grep", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})

    it "set /.*/ by default", ->
      @runner.grep()
      expect(@runner.runner._grep).to.match /.*/

    it "can set to another RegExp", ->
      re = /.+/
      @runner.grep(re)

      expect(@runner.runner._grep).to.eq re

  context "#anyTestInSuite", ->
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

      @runner = $Cypress.Runner.runner(@Cypress, runner)

    it "iterates through all of the tests of a suite", ->
      tests = []

      ## start from the root suite
      @runner.anyTestInSuite @runner.runner.suite, (test) ->
        tests.push(test)

      allTests = _.every tests, (test) -> test.type is "test"
      expect(allTests).to.be.true
      expect(tests).to.have.length(4)

    it "can bail by returning true", ->
      iterator = @sandbox.spy _.after 2, ->
        ## return early by returning true after
        ## the second invocation
        return true

      @runner.anyTestInSuite @runner.runner.suite, iterator

      expect(iterator.callCount).to.eq(2)

    it "returns true if any iterator returns true", ->
      iterator = _.after 2, -> return true

      ret = @runner.anyTestInSuite @runner.runner.suite, iterator
      expect(ret).to.be.true

    it "returns false if not any iterator returns true", ->
      iterator = -> return false

      ret = @runner.anyTestInSuite @runner.runner.suite, iterator
      expect(ret).to.be.false

  context "#normalizeAll", ->
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

      @runner = $Cypress.Runner.runner(@Cypress, runner)

    it "pushes runnable into runnables array", ->
      ## 2 suites + 4 tests + 1 root = 7 total
      expect(@runner.runnables).to.have.length(7)

    it "pushes tests into tests array", ->
      ## 4 tests
      expect(@runner.tests).to.have.length(4)

    it "only pushes matching grep tests", ->
      ## with 4 existing tests
      expect(@runner.tests).to.have.length(4)

      @runner.grep(/four/)

      @runner.normalizeAll()

      ## only 1 test should have matched the grep
      expect(@runner.tests).to.have.length(1)

    it "sets runnable type", ->
      types = _.map @runner.runnables, "type"
      expect(types).to.deep.eq ["suite", "test", "suite", "test", "test", "suite", "test"]

    it "returns only matching tests + suites to the grep", ->
      runnables = @runner.normalizeAll({}, /four/)

      expect(@runner.tests).to.have.length(1)

      titles = []

      getTitle = (runnable) ->
        titles.push(runnable.title)

        if t = runnable.tests
          _.each(t, getTitle)

        if s = runnable.suites
          _.each(s, getTitle)

      getTitle(runnables)

      expect(titles).to.deep.eq [
        "", "suite 1", "suite 2", "suite 2, four"
      ]

    context "runnable optimizations", ->
      beforeEach ->
        ## make sure we reset our runnables
        ## so it appears as if this is a clean
        ## run!
        @runner.runnables = []

      it.skip "never invokes #iterateThroughRunnables", ->
        @runner.runnables = []
        @runner.normalizeAll()
        iterateThroughRunnables = @sandbox.spy @runner, "iterateThroughRunnables"
        @runner.normalizeAll()
        expect(iterateThroughRunnables).not.to.be.called

      it.skip "does not continue to push into .runnables or mutate them", ->
        @runner.runnables = []
        @runner.normalizeAll()
        runnables = @runner.runnables
        expect(runnables).to.have.length(6)
        @runner.normalizeAll()
        expect(@runner.runnables).to.have.length(6)
        expect(@runner.runnables).to.eq(runnables)

      it "only tests the grep once for each test runnable", ->
        @runner.runnables = []

        grep = /\w+/
        test = @sandbox.spy grep, "test"

        @runner.normalizeAll({}, grep)

        ## we have 4 tests, thats how many should have been grepp'd!
        expect(test.callCount).to.eq 4

      it "regreps the tests if grep has changed between iterations", ->
        @runner.runnables = []

        grep = @runner.grep /\w+/
        test = @sandbox.spy @runner.runner._grep, "test"
        @runner.normalizeAll()

        grep2 = @runner.grep /.+/
        test2 = @sandbox.spy @runner.runner._grep, "test"
        @runner.normalizeAll()

        ## should grep each of the tests twice
        expect(test.callCount + test2.callCount).to.eq 8

  context "#stop", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})
      @restore = @sandbox.stub @runner, "restore"

    it "calls restore", ->
      @Cypress.trigger("stop")
      expect(@restore).to.be.calledOnce

    it "null outs Cypress.runner", ->
      expect(@Cypress.runner).to.be.ok
      @Cypress.trigger("stop")
      expect(@Cypress.runner).to.be.null

  context "#restore", ->
    beforeEach ->
      runner = Fixtures.createRunnables
        hooks: ["beforeEach"]
        tests: ["root test 1", "root test 2"]
        suites:
          "suite 1":
            tests: ["suite 1, test 1", "suite 1, test 2"]
          "suite 2":
            tests: ["suite 2, test 1"]

      @runner = $Cypress.Runner.runner(@Cypress, runner)

    it "removeAllListeners runnables", (done) ->
      @runner.runner.on "end", =>
        @removeAllListeners = _.map @runner.runnables, (r) =>
          @sandbox.spy r, "removeAllListeners"

      @runner.run =>
        _.each @removeAllListeners, (r) ->
          expect(r).to.be.calledOnce
        done()

    it "removeAllListeners runner", (done) ->
      @runner.runner.on "end", =>
        @removeAllListeners = @sandbox.spy @runner.runner, "removeAllListeners"


      @runner.run =>
        expect(@removeAllListeners).to.be.calledOnce
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

      @runner = $Cypress.Runner.runner(@Cypress, runner)

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

      @runner.run ->
        ## so we didnt run 2, and should only
        ## have run 3 tests!
        expect(tests).to.have.length(3)
        done()

    it "calls #restore", (done) ->
      restore = @sandbox.spy @runner, "restore"

      tests = []

      @runner.runner.on "test", (test) =>
        ## we abort after the 3rd test
        if test.title is "suite 1, test 1"
          @runner.abort()

      @runner.run ->
        expect(restore).to.be.calledOnce
        done()

  context "#options", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})

    it "sets grep if options.grep", ->
      grep = @sandbox.spy @runner, "grep"
      re = /.+/
      @runner.options grep: re
      expect(grep).to.be.calledWith re

  context "#fail", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})

    it "calls runner.uncaught with err", ->
      runnable = {callback: ->}
      callback = @sandbox.stub runnable, "callback"

      err = new Error
      @Cypress.trigger("fail", err, runnable)

      expect(callback).to.be.calledWith(err)

    it "calls afterEachFailed if runnable state is passed", ->
      afterEachFailed = @sandbox.spy @runner, "afterEachFailed"

      err = new Error
      runnable = {state: "passed", callback: ->}
      @Cypress.trigger "fail", err, runnable

      expect(afterEachFailed).to.be.calledWith runnable, err

    it "does not call afterEachFailed if runnable state isnt passed", ->
      afterEachFailed = @sandbox.spy @runner, "afterEachFailed"

      err = new Error
      @Cypress.trigger "fail", err, {callback: ->}

      expect(afterEachFailed).not.to.be.called

  context "#afterEachFailed", ->
    beforeEach ->
      @runner = $Cypress.Runner.runner(@Cypress, {})
      @_test = {}
      @err = new Error

    it "sets state to failed", ->
      @runner.afterEachFailed(@_test, @err)
      expect(@_test.state).to.eq "failed"

    it "sets err to err", ->
      @runner.afterEachFailed(@_test, @err)
      expect(@_test.err).to.deep.eq @runner.wrapErr(@err)

    ## FIXME
    it.skip "triggers test:end", ->
      trigger = @sandbox.spy @Cypress, "trigger"
      @runner.afterEachFailed(@_test, @err)
      expect(trigger).to.be.calledWith "mocha", "test end", @_test
