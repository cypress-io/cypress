require("../spec_helper")

_ = require("lodash")
Promise = require("bluebird")
background = require("#{root}lib/background")
task = require("#{root}lib/task")

fail = (message) -> throw new Error(message)

describe "lib/task", ->
  beforeEach ->
    @backgroundFile = "cypress/background"
    sinon.stub(background, "execute").resolves("result")
    sinon.stub(background, "isRegistered").returns(true)

  it "executes the 'task' event", ->
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 1000 }).then ->
      expect(background.execute).to.be.calledWith("task", "some:task", "some:arg")

  it "resolves the result of the 'task' event", ->
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 1000 }).then (result) ->
      expect(result).to.equal("result")

  it "throws if 'task' event is not registered", ->
    background.isRegistered.returns(false)

    task.run(@backgroundFile, { timeout: 1000 }).catch (err) =>
      expect(err.message).to.equal("The 'task' event has not been registered in the background file. You must register it before using cy.task()\n\nFix this in your background file here:\n#{@backgroundFile}\n\nhttps://on.cypress.io/api/task")

  it "throws if 'task' event resolves __cypress_unhandled__", ->
    background.execute.withArgs("task").resolves("__cypress_unhandled__")
    background.execute.withArgs("_get:task:keys").resolves(["foo", "bar"])
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) =>
      expect(err.message).to.equal("The task 'some:task' was not handled in the background file. The following tasks are registered: foo, bar\n\nFix this in your background file here:\n#{@backgroundFile}\n\nhttps://on.cypress.io/api/task")

  it "throws if 'task' event resolves undefined", ->
    background.execute.withArgs("task").resolves(undefined)
    background.execute.withArgs("_get:task:body").resolves("function () {}")
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) =>
      expect(err.message).to.equal("The task 'some:task' returned undefined. You must return a promise, a value, or null to indicate that the task was handled.\n\nThe task handler was:\n\nfunction () {}\n\nFix this in your background file here:\n#{@backgroundFile}\n\nhttps://on.cypress.io/api/task")

  it "throws if 'task' event resolves undefined - without task body", ->
    background.execute.withArgs("task").resolves(undefined)
    background.execute.withArgs("_get:task:body").resolves("")
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 1000 }).catch (err) =>
      expect(err.message).to.equal("The task 'some:task' returned undefined. You must return a promise, a value, or null to indicate that the task was handled.\n\nFix this in your background file here:\n#{@backgroundFile}\n\nhttps://on.cypress.io/api/task")

  it "throws if it times out", ->
    background.execute.withArgs("task").resolves(Promise.delay(250))
    background.execute.withArgs("_get:task:body").resolves("function () {}")
    task.run(@backgroundFile, { task: "some:task", arg: "some:arg", timeout: 10 }).catch (err) =>
      expect(err.message).to.equal("The task handler was:\n\nfunction () {}\n\nFix this in your background file here:\n#{@backgroundFile}\n\nhttps://on.cypress.io/api/task")
