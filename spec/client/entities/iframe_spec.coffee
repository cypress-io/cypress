describe "Iframe Entity", ->
  beforeEach ->
    @runner   = App.request("runner:entity")
    @config   = App.config = App.request("new:config:entity")
    @iframe   = @runner.iframe
    @Cypress  = @runner.Cypress

  context "#stop", ->
    it "stops listening", ->
      stopListening = @sandbox.spy @iframe, "stopListening"
      @iframe.stop()
      expect(stopListening).to.be.calledOnce

    it "resets state object literal", ->
      @iframe.state = {foo: "bar"}
      @iframe.stop()
      expect(@iframe.state).to.deep.eq({})

  context "#defaults", ->
    it "sets browser to null", ->
      expect(@iframe.get("browser")).to.be.null

    it "sets version to null", ->
      expect(@iframe.get("version")).to.be.null

  context "#listeners", ->
    it "listens to Cypress.url:changed", ->
      setUrl = @sandbox.spy @iframe, "setUrl"
      @Cypress.trigger "url:changed", "http://localhost:3000/users/1"
      expect(setUrl).to.be.calledWith "http://localhost:3000/users/1"

    it "listens to Cypress.page:loading", ->
      setPageLoading = @sandbox.spy @iframe, "setPageLoading"
      @Cypress.trigger "page:loading", true
      expect(setPageLoading).to.be.calledWith true

    it "listens to runner before:run", ->
      @runner.trigger "before:run"
      expect(@iframe.isRunning()).to.be.true

    it "listens to runner after:run", ->
      @runner.trigger "after:run"
      expect(@iframe.isRunning()).to.be.false

    it "resets the state before each run", ->
      @iframe.set "url", "foo"
      @iframe.state = {foo: "bar"}
      @runner.trigger "before:run"
      expect(@iframe.state).to.deep.eq({})
      expect(@iframe.get("url")).to.be.null

    it "listens to Cypress stop", ->
      stop = @sandbox.spy @iframe, "stop"
      @Cypress.trigger "stop"
      expect(stop).to.be.calledOnce

    it "listens to Cypress initialize", ->
      setViewport = @sandbox.spy @iframe, "setViewport"
      @Cypress.trigger "initialize", {config: {viewportWidth: 500, viewportHeight: 800, foo: "bar"}}
      expect(setViewport).to.be.calledWithExactly({viewportWidth: 500, viewportHeight: 800})

  context "#commandExit", ->
    it "triggers 'clear:revert:message' without originalBody", ->
      trigger = @sandbox.spy @iframe, "trigger"

      expect(@iframe.commandExit()).to.eq(@iframe)
      expect(trigger).to.be.calledWith("clear:revert:message")

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

  context "#setViewport", ->
    it "sets viewport object", ->
      setViewport = @sandbox.spy @iframe, "setViewport"
      @Cypress.trigger "viewport", {viewportWidth: 800, viewportHeight: 600}

      expect(setViewport).to.be.calledOnce
      expect(@iframe.get("viewportWidth")).to.eq 800
      expect(@iframe.get("viewportHeight")).to.eq 600

    it "triggers 'resize:viewport'", ->
      trigger = @sandbox.spy @iframe, "trigger"
      @Cypress.trigger "viewport", {viewportWidth: 800, viewportHeight: 600}

      expect(trigger).to.be.calledWith "resize:viewport"

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

    it "calls revertViewport with command", ->
      viewport = {viewportWidth: 1024, viewportHeight: 768}
      @command.set viewport
      revertViewport = @sandbox.spy @iframe, "revertViewport"

      @iframe.revertDom(@snapshot, @command)
      expect(revertViewport).to.be.calledWith viewport

    it "calls revertUrl with command", ->
      url = "http://localhost:8000"
      @command.set {url: url}
      revertUrl = @sandbox.spy @iframe, "revertUrl"

      @iframe.revertDom(@snapshot, @command)
      expect(revertUrl).to.be.calledWith url

  context "#revertUrl", ->
    beforeEach ->
      @url = "http://localhost:8000"
      @iframe.setUrl @url
      expect(@iframe.state).to.deep.eq {}

    it "sets url to state", ->
      @iframe.revertUrl(@url)
      expect(@iframe.state.url).to.eq @url

    it "does not reset state if already set", ->
      @iframe.revertUrl(@url)
      @iframe.revertUrl("www.github.com")
      expect(@iframe.state.url).to.eq @url

    it "sets the url on the iframe model", ->
      @iframe.revertUrl(@url)
      expect(@iframe.get("url")).to.eq @url

  context "#revertViewport", ->
    beforeEach ->
      @viewport = {viewportWidth: 1024, viewportHeight: 768}
      @iframe.setViewport @viewport
      expect(@iframe.state).to.deep.eq {}

    it "sets viewport width and height to state", ->
      @iframe.revertViewport(@viewport)
      expect(@iframe.state.viewportWidth).to.eq 1024
      expect(@iframe.state.viewportHeight).to.eq 768

    it "does not reset state if already set", ->
      viewport2 = {viewportWidth: 800, viewportHeight: 600}
      @iframe.revertViewport(viewport2)
      expect(@iframe.state.viewportWidth).to.eq 1024
      expect(@iframe.state.viewportHeight).to.eq 768

    it "sets the viewport on the iframe model", ->
      viewport2 = {viewportWidth: 800, viewportHeight: 600}
      @iframe.revertViewport(viewport2)
      expect(@iframe.get("viewportWidth")).to.eq 800
      expect(@iframe.get("viewportHeight")).to.eq 600

  context "#restoreViewport", ->
    it "is noop unless viewportWidth and viewportHeight is defined", ->
      expect(@iframe.restoreViewport()).to.be.undefined

    it "sets viewport back to what was stored in the state", ->
      @viewport = {viewportWidth: 1024, viewportHeight: 768}
      @iframe.setViewport @viewport
      @iframe.revertViewport({viewportWidth: 800, viewportHeight: 600})
      @iframe.restoreViewport()
      expect(@iframe.state.viewportWidth).to.eq 1024
      expect(@iframe.state.viewportHeight).to.eq 768
