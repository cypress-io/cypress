describe "Runner Entity", ->
  beforeEach ->
    ## make sure we provide our socket entity whenever our runner
    ## requests it, so we can control its events / emission
    ## since we wrapped socket.io it makes testing this very easy
    @socket = App.request "io:entity"
    App.reqres.setHandler "socket:entity", => @socket

  context ".only tests", ->
    beforeEach ->
      df = loadFixture("tests/only", autoResolve: false).progress (iframe) =>
        @contentWindow = iframe.contentWindow
        @mocha         = iframe.contentWindow.mocha
        @runner        = iframe.contentWindow.mocha.run -> df.resolve()

    it "triggers 'exclusive:test' when tests have an .only", (done) ->
      @runnerModel = App.request("start:test:runner")

      ## we need to set the runner model's grep options
      ## to our iframes mocha options
      @runnerModel.options.grep = @mocha.options.grep

      trigger = @sandbox.spy @runnerModel, "trigger"

      @runnerModel.runIframeSuite "only.html", @contentWindow, ->
        expect(trigger).to.be.calledWith "exclusive:test"
        done()

    it "does not trigger 'exclutive:test' when tests do not have a .only", (done) ->
      @runnerModel = App.request("start:test:runner")
      @runnerModel.options.grep = /.*/
      trigger = @sandbox.spy @runnerModel, "trigger"
      @runnerModel.runIframeSuite "only.html", @contentWindow, ->
        expect(trigger).not.to.be.calledWith "exclusive:test"
        done()

  context "events", ->
    beforeEach ->
      df = loadFixture("tests/events", autoResolve: false).progress (iframe) =>
        @contentWindow = iframe.contentWindow
        @mocha         = iframe.contentWindow.mocha
        @runner        = iframe.contentWindow.mocha.run -> df.resolve()

    it "triggers the following events", (done) ->
      @runnerModel = App.request "start:test:runner",
        mocha: @mocha
        runner: @runner

      @runnerModel.options.grep = /.*/

      trigger = @sandbox.spy @runnerModel, "trigger"

      @runnerModel.runIframeSuite "events.html", @contentWindow, ->
        events = _(trigger.args).map (args) -> args[0]
        expect(events).to.deep.eq [
          "before:run"
          "before:add"
          "suite:add"
          "test:add"
          "after:add"
          "suite:start"
          "suite:start"
          "test:start"
          "test:end"
          "suite:stop"
          "suite:stop"
          "after:run"
          # "runner:end"
        ]
        done()

    it "prevents the 'end' event from firing until all tests have run", (done) ->
      @runnerModel = App.request("start:test:runner")
      @runnerModel.options.grep = /.*/

      runner = @runnerModel.runner
      emit = @sandbox.spy runner, "emit"

      @runnerModel.runIframeSuite "events.html", @contentWindow, ->
        lastEvent = _.last(emit.args)[0]
        expect(lastEvent).to.eq "eclectus end"
        done()

  context "runner state", ->
    beforeEach ->
      df = loadFixture("tests/events", autoResolve: false).progress (iframe) =>
        @contentWindow = iframe.contentWindow
        @mocha         = iframe.contentWindow.mocha
        @runner        = iframe.contentWindow.mocha.run -> df.resolve()

    it "clears out the runner.test before a test run", ->
      @runnerModel = App.request("start:test:runner")
      @runnerModel.options.grep = /.*/

      runner = @runnerModel.runner

      runner.test = "last test"

      @sandbox.stub runner, "runSuite"

      @runnerModel.runIframeSuite "events.html", @contentWindow, ->

      expect(runner.test).to.be.undefined