describe "Runner Entity", ->
  beforeEach ->
    ## make sure we provide our socket entity whenever our runner
    ## requests it, so we can control its events / emission
    ## since we wrapped socket.io it makes testing this very easy
    @socket = App.request "io:entity"
    App.reqres.setHandler "socket:entity", => @socket

  context ".only tests", ->
    beforeEach ->
      loadFixture("tests/only").progress (iframe) =>
        @contentWindow = iframe.contentWindow
        @mocha         = iframe.contentWindow.mocha
        @runner        = iframe.contentWindow.mocha.run()

    it "triggers 'exclusive:test' when tests have an .only", ->
      @runnerModel = App.request "runner:entity", @runner, @mocha.options, Eclectus.patch, Eclectus.sandbox
      trigger = @sandbox.spy @runnerModel, "trigger"
      @runnerModel.runIframeSuite "only.html", @contentWindow
      expect(trigger).to.be.calledWith "exclusive:test"

    it "does not trigger 'exclutive:test' when tests do not have a .only", ->
      @mocha.options.grep = /.*/
      @runnerModel = App.request "runner:entity", @runner, @mocha.options, Eclectus.patch, Eclectus.sandbox
      trigger = @sandbox.spy @runnerModel, "trigger"
      @runnerModel.runIframeSuite "only.html", @contentWindow
      expect(trigger).not.to.be.calledWith "exclusive:test"

  context "events", ->
    beforeEach ->
      loadFixture("tests/events").progress (iframe) =>
        @contentWindow = iframe.contentWindow
        @mocha         = iframe.contentWindow.mocha
        @runner        = iframe.contentWindow.mocha.run()

    it "triggers the following events", (done) ->
      @mocha.options.grep = /.*/
      @runnerModel = App.request "runner:entity", @runner, @mocha.options, Eclectus.patch, Eclectus.sandbox
      trigger = @sandbox.spy @runnerModel, "trigger"
      @runner.on "end", ->
        events = _(trigger.args).map (args) -> args[0]
        debugger
        expect(events).to.deep.eq [
          "before:run"
          "before:add"
          "test:add"
          "suite:add"
          "test:add"
          "after:add"
          "suite:start"
          "test:start"
          "test:start"
          "test:end"
          "test:end"
          "suite:start"
          "test:start"
          "suite:start"
          "test:end"
          "test:start"
          "test:end"
          "suite:stop"
          "suite:stop"
          "after:run"
          "suite:stop"
          "suite:stop"
          "runner:end"
        ]
        done()
      @runnerModel.runIframeSuite "events.html", @contentWindow