require("../spec_helper")

chalk  = require("chalk")
errors = require("#{root}lib/errors")

describe.only "lib/errors", ->
  beforeEach ->
    @env = process.env.CYPRESS_ENV
    @log = @sandbox.stub(console, "log")

  afterEach ->
    process.env.CYPRESS_ENV = @env

  context ".log", ->
    it "uses red by default", ->
      err = errors.get("NOT_LOGGED_IN")
      errors.log(err).then =>
        red = chalk.styles.red

        expect(@log).to.be.calledWithMatch(red.open)
        expect(@log).to.be.calledWithMatch(red.close)

    it "can change the color", ->
      err = errors.get("DEV_NO_SERVER")
      errors.log(err, "yellow").then =>
        yellow = chalk.styles.yellow

        expect(@log).to.be.calledWithMatch(yellow.open)
        expect(@log).to.be.calledWithMatch(yellow.close)

    it "logs err.message", ->
      err = errors.get("NO_PROJECT_ID", "foo/bar/baz")
      errors.log(err).then =>
        expect(@log).to.be.calledWithMatch("foo/bar/baz")

    it "logs err.stack in development", ->
      process.env.CYPRESS_ENV = "development"

      foo = new Error("foo")
      errors.log(foo).then =>
        expect(@log).to.be.calledWith(foo.stack)

    it "does not log err.stack in production", ->
      process.env.CYPRESS_ENV = "production"

      foo = new Error("foo")
      errors.log(foo).then =>
        expect(@log).not.to.be.calledWith(foo.stack)