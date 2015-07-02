describe "Iframe Entity", ->
  beforeEach ->
    @runner   = App.request("runner:entity")
    @config   = App.config = App.request("new:config:entity")
    @iframe   = @runner.iframe
    @Cypress  = @runner.Cypress

  context "#stop", ->
    it "stops listening"

    it "resets state object literal"

  context "#commandExit", ->
    it "is noop without originalBody", ->
      expect(@iframe.commandExit()).to.be.undefined

  context "#commandEnter", ->
    beforeEach ->
      @snapshot = {foo: "bar"}
      @command = {getSnapshot: => @snapshot}
      @iframe.isRunning(false)

    it "triggers 'cannot:revert:dom' if isRunning", ->
      trigger = @sandbox.spy @iframe, "trigger"

      @iframe.isRunning(true)
      @iframe.commandEnter()

      expect(trigger).to.be.calledWith "cannot:revert:dom"

    it "gets and sets originalBody if one doesnt exist", ->
      @sandbox.stub(@iframe, "trigger").withArgs("detach:body").callsArgWith(1, {})
      @sandbox.stub(@iframe, "revertDom")

      @iframe.commandEnter(@command)
      expect(@iframe.state.originalBody).to.deep.eq {}

    it "calls revertDom with snapshot and command", ->
      @sandbox.stub(@iframe, "trigger").withArgs("detach:body").callsArgWith(1, {})
      @sandbox.stub(@iframe, "revertDom")

      @iframe.commandEnter(@command)

      expect(@iframe.revertDom).to.be.calledWith(@snapshot, @command)

    it "calls revertDom immediately when originalBody exists", ->
      trigger = @sandbox.spy(@iframe, "trigger")
      @sandbox.stub(@iframe, "revertDom")

      @iframe.state.originalBody = {}
      @iframe.commandEnter(@command)

      expect(@iframe.revertDom).to.be.calledWith(@snapshot, @command)
      expect(@iframe.trigger).not.to.be.calledWith("detach:body")

  context "#revertDom", ->
    beforeEach ->
      @snapshot = {}
      @command = new Backbone.Model
      @command.getEl = ->

    it "triggers 'revert:dom' with body", ->
      trigger = @sandbox.spy(@iframe, "trigger")
      @iframe.revertDom(@snapshot, @command)
      expect(trigger).to.be.calledWith "revert:dom", @snapshot

    it "sets state.detachedId to command.id", ->
      @iframe.revertDom(@snapshot, @command)
      expect(@iframe.state.detachedId).to.eq @command.cid

    it "triggers 'highlight:el' with command options if command hasEl", ->
      @command.set {
        coords: 999
        highlightAttr: "foo"
        scrollBy: 100
      }
      @command.getEl = -> {el: "el"}

      trigger = @sandbox.spy(@iframe, "trigger")
      @iframe.revertDom(@snapshot, @command)
      expect(trigger).to.be.calledWith "highlight:el", {el: "el"}, {
        coords: 999
        highlightAttr: "foo"
        scrollBy: 100
        dom: @snapshot
      }

    it "does not trigger 'highlight:el' when command doesnt hasEl", ->
      trigger = @sandbox.spy(@iframe, "trigger")
      @iframe.revertDom(@snapshot, @command)
      expect(trigger).not.to.be.calledWith "highlight:el"


