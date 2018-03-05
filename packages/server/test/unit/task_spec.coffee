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

  it "executes the task:requested plugin", ->
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).then ->
      expect(plugins.execute).to.be.calledWith("task:requested", "some:task", "some:arg")

  it "resolves the result of the task:requested plugin", ->
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).then (result) ->
      expect(result).to.equal("result")

  it "throws if task:requested is not registered", ->
    plugins.has.returns(false)

    task.run({ timeout: 1000 }).catch (err) ->
      expect(err.message).to.equal("The 'task:requested' event has not been registered in the plugins file, so cy.task() cannot run")

  it "throws if task:requested resolves undefined", ->
    plugins.execute.resolves(undefined)
    task.run({ task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) ->
      expect(err.message).to.equal("The task 'some:task' was not handled in the plugins file")

  it "throws if it times out", ->
    plugins.execute.resolves(Promise.delay(250))
    task.run({ task: "some:task", arg: "some:arg", timeout: 10 }).catch (err) ->
      expect(err.message).to.equal("Process timed out\ntask: some:task")
