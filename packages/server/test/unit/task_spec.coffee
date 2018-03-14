require("../spec_helper")

_ = require("lodash")
Promise = require("bluebird")
plugins = require("#{root}lib/plugins")
task = require("#{root}lib/task")

fail = (message) -> throw new Error(message)

describe "lib/task", ->
  beforeEach ->
    @sandbox.stub(plugins, "execute").resolves("result")
    @sandbox.stub(plugins, "has").returns(true)

  it "executes the 'task' plugin", ->
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).then ->
      expect(plugins.execute).to.be.calledWith("task", "some:task", "some:arg")

  it "resolves the result of the 'task' plugin", ->
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).then (result) ->
      expect(result).to.equal("result")

  it "throws if 'task' event is not registered", ->
    plugins.has.returns(false)

    task.run({ timeout: 1000 }).catch (err) ->
      expect(err.message).to.equal("The 'task' event has not been registered in the plugins file, so cy.task() cannot run")

  it "throws if 'task' event resolves __cypress_unhandled__", ->
    plugins.execute.resolves("__cypress_unhandled__")
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) ->
      expect(err.message).to.equal("The task 'some:task' was not handled in the plugins file")

  it "throws if 'task' event resolves undefined", ->
    plugins.execute.resolves(undefined)
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) ->
      expect(err.message).to.equal("The task 'some:task' returned undefined. Return a promise, a value, or null to indicate that the task was handled.")

  it "throws if it times out", ->
    plugins.execute.resolves(Promise.delay(250))
    task.run({ task: "some:task", arg: "some:arg", timeout: 10 }).catch (err) ->
      expect(err.message).to.equal("Process timed out\ntask: some:task")
