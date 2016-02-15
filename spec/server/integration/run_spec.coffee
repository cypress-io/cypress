require("../spec_helper")

Fixtures = require("../helpers/fixtures")
api      = require("#{root}lib/api")
run      = require("#{root}lib/run")
user     = require("#{root}lib/user")
Project  = require("#{root}lib/project")

describe.only "lib/run", ->
  beforeEach ->
    Fixtures.scaffold()
    @todosPath = Fixtures.projectPath("todos")

    ## force run to call directly into main without
    ## spawning a separate process
    @sandbox.stub(run, "isCurrentlyRunningElectron").returns(true)
    @sandbox.stub(process, "exit")

  afterEach ->
    Fixtures.remove()

  after ->
    mockery.disable()

  context "--get-key", ->
    beforeEach ->
      @session = "session-123"

      Promise.all([
        user.set({name: "brian", session_token: @session}),

        Project.add(@todosPath).then (id) =>
          @projectId = id
      ])

    it "writes out key and exits", ->
      @sandbox.stub(console, "log")
      @sandbox.stub(api, "getProjectToken")
      .withArgs(@projectId, @session)
      .resolves("new-key-123")

      run.start(["--get-key", "--project=#{@todosPath}"]).then ->
        expect(console.log).to.be.calledWith("new-key-123")
        expect(process.exit).to.be.calledWith(0)
