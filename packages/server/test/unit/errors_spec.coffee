require("../spec_helper")

style = require("ansi-styles")
chalk  = require("chalk")
errors = require("#{root}lib/errors")
logger = require("#{root}lib/logger")

describe "lib/errors", ->
  beforeEach ->
    sinon.spy(console, "log")
  
  context ".log", ->
    it "uses red by default", ->
      err = errors.get("NOT_LOGGED_IN")
      
      ret = errors.log(err)

      expect(ret).to.be.undefined

      red = style.red

      expect(console.log).to.be.calledWithMatch(red.open)
      expect(console.log).to.be.calledWithMatch(red.close)

    it "can change the color", ->
      err = errors.get("NOT_LOGGED_IN")
      
      ret = errors.log(err, "yellow")

      expect(ret).to.be.undefined

      yellow = style.yellow

      expect(console.log).to.be.calledWithMatch(yellow.open)
      expect(console.log).to.be.calledWithMatch(yellow.close)

    it "logs err.message", ->
      err = errors.get("NO_PROJECT_ID", "foo/bar/baz")
      
      ret = errors.log(err)

      expect(ret).to.be.undefined
      
      expect(console.log).to.be.calledWithMatch("foo/bar/baz")

    it "logs err.details", ->
      err = errors.get("PLUGINS_FUNCTION_ERROR", "foo/bar/baz", "details huh")
      
      ret = errors.log(err)
      
      expect(ret).to.be.undefined
      
      expect(console.log).to.be.calledWithMatch("foo/bar/baz")
      expect(console.log).to.be.calledWithMatch("\n", "details huh")

    it "logs err.stack in development", ->
      process.env.CYPRESS_ENV = "development"

      err = new Error("foo")
      
      ret = errors.log(err)

      expect(ret).to.eq(err)
      
      expect(console.log).to.be.calledWith(chalk.red(err.stack))

  context ".logException", ->
    it "calls logger.createException with unknown error", ->
      sinon.stub(logger, "createException").resolves()
      sinon.stub(process.env, "CYPRESS_ENV").value("production")

      err = new Error("foo")

      errors.logException(err)
      .then ->
        expect(console.log).to.be.calledWith(chalk.red(err.stack))
        expect(logger.createException).to.be.calledWith(err)

    it "does not call logger.createException when known error", ->
      sinon.stub(logger, "createException").resolves()
      sinon.stub(process.env, "CYPRESS_ENV").value("production")

      err = errors.get("NOT_LOGGED_IN")

      errors.logException(err)
      .then ->
        expect(console.log).not.to.be.calledWith(err.stack)
        expect(logger.createException).not.to.be.called

    it "does not call logger.createException when not in production env", ->
      sinon.stub(logger, "createException").resolves()
      sinon.stub(process.env, "CYPRESS_ENV").value("development")

      err = new Error("foo")

      errors.logException(err)
      .then ->
        expect(console.log).not.to.be.calledWith(err.stack)
        expect(logger.createException).not.to.be.called
    
    it "swallows creating exception errors", ->
      sinon.stub(logger, "createException").rejects(new Error("foo"))
      sinon.stub(process.env, "CYPRESS_ENV").value("production")

      err = errors.get("NOT_LOGGED_IN")

      errors.logException(err)
      .then (ret) ->
        expect(ret).to.be.undefined

  context ".clone", ->
    it "converts err.message from ansi to html with span classes", ->
      err = new Error("foo" + chalk.blue("bar") + chalk.yellow("baz"))
      obj = errors.clone(err, {html: true})
      expect(obj.message).to.eq('foo<span class="ansi-blue-fg">bar</span><span class="ansi-yellow-fg">baz</span>')
