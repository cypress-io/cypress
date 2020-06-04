/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require("../spec_helper");

const Reporter = require(`${root}lib/reporter`);
const snapshot = require("snap-shot-it");

describe("lib/reporter", function() {
  beforeEach(function() {
    this.reporter = new Reporter();

    this.root = {
      id: 'r1',
      root: true,
      title: '',
      tests: [],
      suites: [
        {
          id: 'r2',
          title: 'TodoMVC - React',
          tests: [],
          suites: [
            {
              id: 'r3',
              title: 'When page is initially opened',
              tests: [
                {
                  id: 'r4',
                  title: 'should focus on the todo input field',
                  duration: 4,
                  state: 'failed',
                  timedOut: false,
                  async: 0,
                  sync: true,
                  err: {
                    message: "foo",
                    stack: [1, 2, 3]
                  }
                },
                {
                  id: 'r5',
                  title: 'does something good',
                  duration: 4,
                  state: 'pending',
                  timedOut: false,
                  async: 0,
                  sync: true
                }
              ],
              suites: []
            }
          ]
        }
      ]
    };

    this.testObj = this.root.suites[0].suites[0].tests[0];

    return this.reporter.setRunnables(this.root);
  });

  context(".create", function() {
    it("can create mocha-teamcity-reporter", function() {
      const teamCityFn = sinon.stub();
      mockery.registerMock("mocha-teamcity-reporter", teamCityFn);

      const reporter = Reporter.create("teamcity");
      reporter.setRunnables(this.root);

      expect(reporter.reporterName).to.eq("teamcity");
      return expect(teamCityFn).to.be.calledWith(reporter.runner);
    });

    return it("can create mocha-junit-reporter", function() {
      const junitFn = sinon.stub();
      mockery.registerMock("mocha-junit-reporter", junitFn);

      const reporter = Reporter.create("junit");
      reporter.setRunnables(this.root);

      expect(reporter.reporterName).to.eq("junit");
      return expect(junitFn).to.be.calledWith(reporter.runner);
    });
  });

  context("createSuite", function() {
    beforeEach(function() {
      return this.errorObj = {
        message: 'expected true to be false',
        name: 'AssertionError',
        stack: 'AssertionError: expected true to be false',
        actual: true,
        expected: false,
        showDiff: false
      };});

    return it("recursively creates suites for fullTitle", function() {
      const args = this.reporter.parseArgs("fail", [this.testObj]);
      console.log(args);
      expect(args[0]).to.eq("fail");

      const title = "TodoMVC - React When page is initially opened should focus on the todo input field";
      return expect(args[1].fullTitle()).to.eq(title);
    });
  });

  context("#stats", () => it("has reporterName stats, reporterStats, etc", function() {
    sinon.stub(Date, "now").returns(1234);

    this.reporter.emit("test", this.testObj);
    this.reporter.emit("fail", this.testObj);
    this.reporter.emit("test end", this.testObj);

    this.reporter.reporterName = "foo";

    return snapshot(this.reporter.results());
  }));

  return context("#emit", function() {
    beforeEach(function() {
      return this.emit = sinon.spy(this.reporter.runner, "emit");
    });

    it("emits start", function() {
      this.reporter.emit("start");
      expect(this.emit).to.be.calledWith("start");
      return expect(this.emit).to.be.calledOn(this.reporter.runner);
    });

    it("emits test with updated properties", function() {
      this.reporter.emit("test", {id: "r5", state: "passed"});
      expect(this.emit).to.be.calledWith("test");
      expect(this.emit.getCall(0).args[1].title).to.eq("does something good");
      return expect(this.emit.getCall(0).args[1].state).to.eq("passed");
    });

    it("ignores events not in the events table", function() {
      this.reporter.emit("foo");
      return expect(this.emit).not.to.be.called;
    });

    return it("sends suites with updated properties and nested subtree", function() {
      this.reporter.emit("suite", {id: "r3", state: "passed"});
      expect(this.emit).to.be.calledWith("suite");
      expect(this.emit.getCall(0).args[1].state).to.eq("passed");
      return expect(this.emit.getCall(0).args[1].tests.length).to.equal(2);
    });
  });
});
