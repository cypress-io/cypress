require("../spec_helper")

Reporter = require("#{root}lib/reporter")

describe "lib/reporter", ->
  beforeEach ->
    @reporter = Reporter()

  context "createSuite", ->
    beforeEach ->
      @testObj = {
        id: '002',
        title: 'should focus on the todo input field [002]',
        originalTitle: 'should focus on the todo input field ',
        duration: 4,
        state: 'failed',
        timedOut: false,
        async: 0,
        sync: true,
        parent: {
          id: '001',
          title: 'When page is initially opened [001]',
          originalTitle: 'When page is initially opened ',
          root: false,
          parent: {
            id: '000',
            title: 'TodoMVC - React [000]',
            originalTitle: 'TodoMVC - React ',
            root: false,
            parent: {
              title: '', root: true
            }
          }
        }
      }

      @errorObj = {
        message: 'expected true to be false',
        name: 'AssertionError',
        stack: 'AssertionError: expected true to be false',
        actual: true,
        expected: false,
        showDiff: false
      }

    it "recursively creates suites for fullTitle", ->
      args = @reporter.parseArgs("fail", [@testObj, @errorObj])
      expect(args[0]).to.eq("fail")

      title = "TodoMVC - React [000] When page is initially opened [001] should focus on the todo input field [002]"
      expect(args[1].fullTitle()).to.eq title

    it "adds failures to stats", ->
      @reporter.emit("fail", @testObj, @errorObj)

      expect(@reporter.stats()).to.deep.eq({
        suites: 0
        tests: 0
        passes: 0
        pending: 0
        failures: 1
      })

  context "#emit", ->
    beforeEach ->
      @emit = @sandbox.spy @reporter.runner, "emit"

    it "emits start", ->
      @reporter.emit("start")
      expect(@emit).to.be.calledWith("start", undefined)
      expect(@emit).to.be.calledOn(@reporter.runner)

    it "emits test", ->
      @reporter.emit("test", {title: "foo"})
      expect(@emit).to.be.calledWith("test")
      expect(@emit.getCall(0).args[1].title).to.eq("foo")

    it "ignores events not in the events table", ->
      @reporter.emit("foo")
      expect(@emit).not.to.be.called