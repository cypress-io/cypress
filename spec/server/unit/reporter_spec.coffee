require("../spec_helper")

Reporter = require("#{root}lib/reporter")

describe "lib/reporter", ->
  beforeEach ->
    @reporter = Reporter()

    @root = {
      id: 'r1'
      root: true
      title: ''
      tests: []
      suites: [
        {
          id: '000'
          title: 'TodoMVC - React [000]'
          tests: []
          suites: [
            {
              id: '001'
              title: 'When page is initially opened [001]'
              tests: [
                {
                  id: '002'
                  title: 'should focus on the todo input field [002]'
                  duration: 4
                  state: 'failed'
                  timedOut: false
                  async: 0
                  sync: true
                }
                {
                  id: '003'
                  title: 'does something good'
                  duration: 4
                  state: 'pending'
                  timedOut: false
                  async: 0
                  sync: true
                }
              ]
              suites: []
            }
          ]
        }
      ]
    }

    @testObj = @root.suites[0].suites[0].tests[0]

    @reporter.setRunnables(@root)

  context ".create", ->
    it "can create mocha-teamcity-reporter", ->
      teamCityFn = @sandbox.stub()
      mockery.registerMock("mocha-teamcity-reporter", teamCityFn)

      reporter = Reporter.create("teamcity")
      reporter.setRunnables(@root)

      expect(reporter.reporterName).to.eq("teamcity")
      expect(teamCityFn).to.be.calledWith(reporter.runner)

    it "can create mocha-junit-reporter", ->
      junitFn = @sandbox.stub()
      mockery.registerMock("mocha-junit-reporter", junitFn)

      reporter = Reporter.create("junit")
      reporter.setRunnables(@root)

      expect(reporter.reporterName).to.eq("junit")
      expect(junitFn).to.be.calledWith(reporter.runner)

  context "createSuite", ->
    beforeEach ->
      @errorObj = {
        message: 'expected true to be false'
        name: 'AssertionError'
        stack: 'AssertionError: expected true to be false'
        actual: true
        expected: false
        showDiff: false
      }

    it "recursively creates suites for fullTitle", ->
      args = @reporter.parseArgs("fail", [@testObj])
      expect(args[0]).to.eq("fail")

      title = "TodoMVC - React [000] When page is initially opened [001] should focus on the todo input field [002]"
      expect(args[1].fullTitle()).to.eq title

    it "adds failures to stats", ->
      @reporter.emit("fail", @testObj)

      expect(@reporter.stats()).to.deep.eq({
        reporter: "spec"
        suites: 0
        tests: 0
        passes: 0
        pending: 0
        failures: 1
      })

  context "#stats", ->
    it "merges in reporter name and specific stat properties", ->
      @reporter.reporter.stats = {foo: "bar", tests: 1}
      @reporter.reporterName = "foo"

      expect(@reporter.stats()).to.deep.eq({
        reporter: "foo"
        tests: 1
      })

  context "#emit", ->
    beforeEach ->
      @emit = @sandbox.spy @reporter.runner, "emit"

    it "emits start", ->
      @reporter.emit("start")
      expect(@emit).to.be.calledWith("start", undefined)
      expect(@emit).to.be.calledOn(@reporter.runner)

    it "emits test with updated properties", ->
      @reporter.emit("test", {id: "003", state: "passed"})
      expect(@emit).to.be.calledWith("test")
      expect(@emit.getCall(0).args[1].title).to.eq("does something good")
      expect(@emit.getCall(0).args[1].state).to.eq("passed")

    it "ignores events not in the events table", ->
      @reporter.emit("foo")
      expect(@emit).not.to.be.called

    it "sends suites with updated properties and nested subtree", ->
      @reporter.emit("suite", {id: "001", state: "passed"})
      expect(@emit).to.be.calledWith("suite")
      expect(@emit.getCall(0).args[1].state).to.eq("passed")
      expect(@emit.getCall(0).args[1].tests.length).to.equal(2)
