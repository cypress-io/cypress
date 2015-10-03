require("../spec_helper")

Chromium  = require("#{root}lib/chromium")
Routes    = require("#{root}lib/util/routes")

describe "Chromium", ->
  beforeEach ->
    @win = {
      window: {
        $Cypress: {}
        Mocha:    {}
        console:  {}
      }
    }
    @c = Chromium(@win)

  context "#override", ->
    beforeEach ->
      @afterRun = @sandbox.spy(@c, "_afterRun")
      @exit     = @sandbox.stub(process, "exit")

    it "passes winodw + ci_guid to _afterRun", ->
      @c.override({ci_guid: "123"})
      expect(@afterRun).to.be.calledWith @win.window, "123"

    it "sets $Cypress.afterRun", ->
      @c.override({ci_guid: "123"})
      expect(@c.window.$Cypress.afterRun).to.be.a("function")

    it "POSTS to /tests/:ci_guid with duration + tests", ->
      req = nock(Routes.api())
        .post("/tests/123", {
          duration: 600
          tests: [{}]
        })
        .reply(200)

      @c.override({ci_guid: "123"})
      @c.window.$Cypress.afterRun(600, [{}]).then ->
        req.done()

    it "exits with 1 failure on successful post", ->
      tests = [{state: "passed"}, {state: "passed"}, {state: "failed"}, {state: "pending"}]

      nock(Routes.api())
        .post("/tests/123", {
          duration: 600
          tests: tests
        })
        .reply(200)

      @c.override({ci_guid: "123"})
      @c.window.$Cypress.afterRun(600, tests).then =>
        expect(@exit).to.be.calledWith(1)

    it "exits with 0 failures on failed post", ->
      tests = [{state: "passed"}, {state: "passed"}, {state: "pending"}]

      nock(Routes.api())
        .post("/tests/123", {
          duration: 600
          tests: tests
        })
        .reply(500)

      @c.override({ci_guid: "123"})
      @c.window.$Cypress.afterRun(600, tests).then =>
        expect(@exit).to.be.calledWith(0)