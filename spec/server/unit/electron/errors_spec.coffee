chalk  = require("chalk")
errors = require("#{root}../lib/electron/handlers/errors")

describe "electron/errors", ->
  context ".log", ->
    beforeEach ->
      @sandbox.spy(console, "log")

    it "logs error to console", ->
      err = errors.get("NOT_LOGGED_IN")
      errors.log(err)
      expect(console.log).to.be.calledWithMatch(err.message)
