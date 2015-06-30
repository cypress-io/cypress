describe "Iframe Entity", ->
  beforeEach ->
    @runner   = App.request("runner:entity")
    @config   = App.config = App.request("new:config:entity")
    @iframe   = @runner.iframe
    @Cypress  = @runner.Cypress

  context "#stop", ->
    it "stops listening"

    it "resets state object literal"

  context "#restoreDom", ->
    it "is noop without originalBody", ->
      expect(@iframe.restoreDom()).to.be.undefined

  context "#revertDom", ->
    beforeEach ->
      @iframe.isRunning(false)

    it "triggers 'cannot:revert:dom' if isRunning", ->
      trigger = @sandbox.spy @iframe, "trigger"

      @iframe.isRunning(true)
      @iframe.revertDom()

      expect(trigger).to.be.calledWith "cannot:revert:dom"