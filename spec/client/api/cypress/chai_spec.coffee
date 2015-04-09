describe "$Cypress.Chai API", ->
  beforeEach ->
    @Cypress = $Cypress.create()
    @chai =    $Cypress.Chai.create(@Cypress, {})

    ## by default chai will attempt to
    ## call into cy.assert which isnt
    ## defined, so we restore the override
    @chai.restore()

  context "#listeners", ->
    it "binds to stop event", ->
      stop = @sandbox.stub @chai, "stop"
      @Cypress.trigger("stop")
      expect(stop).to.be.calledOnce

  context "#stop", ->
    it "calls restore", ->
      restore = @sandbox.spy @chai, "restore"
      @Cypress.trigger("stop")
      expect(restore).to.be.calledOnce

    it "null outs Cypress.chai", ->
      expect(@Cypress.chai).to.be.ok
      @Cypress.trigger("stop")
      expect(@Cypress.chai).to.be.null