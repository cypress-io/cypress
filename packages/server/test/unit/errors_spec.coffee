require("../spec_helper")

style = require("ansi-styles")
chalk  = require("chalk")
errors = require("#{root}lib/errors")
logger = require("#{root}lib/logger")

describe "lib/errors", ->
  beforeEach ->
    @env = process.env.CYPRESS_ENV
    @log = sinon.stub(console, "log")

  afterEach ->
    process.env.CYPRESS_ENV = @env

  context ".log", ->
    it "uses red by default", ->
      err = errors.get("NOT_LOGGED_IN")
      errors.log(err).then =>
        red = style.red

        expect(@log).to.be.calledWithMatch(red.open)
        expect(@log).to.be.calledWithMatch(red.close)

    it "can change the color", ->
      err = errors.get("NOT_LOGGED_IN")
      errors.log(err, "yellow").then =>
        yellow = style.yellow

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
        expect(@log).to.be.calledWith(chalk.red(foo.stack))

    it "calls logger.createException", ->
      sinon.stub(logger, "createException").resolves()

      process.env.CYPRESS_ENV = "production"

      foo = new Error("foo")
      errors.log(foo).then =>
        expect(logger.createException).to.be.calledWith(foo)

  context ".clone", ->
    it "converts err.message from ansi to html with span classes", ->
      err = new Error("foo" + chalk.blue("bar") + chalk.yellow("baz"))
      obj = errors.clone(err, {html: true})
      expect(obj.message).to.eq('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>')
