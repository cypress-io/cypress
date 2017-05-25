{ _ } = window.testUtils

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

    it "unbinds previous chai listeners on Cypress", ->
      totalEvents = =>
        _.reduce @Cypress._events, (memo, value, key) ->
          memo += value.length
        , 0

      count = totalEvents()

      ## after instantiating another chai
      chai = $Cypress.Chai.create(@Cypress, {})
      chai.restore()

      ## we shouldn't have any additional events
      expect(totalEvents()).not.to.be.gt count

  context "#stop", ->
    it "calls restore", ->
      restore = @sandbox.spy @chai, "restore"
      @Cypress.trigger("stop")
      expect(restore).to.be.calledOnce

    it "null outs Cypress.chai", ->
      expect(@Cypress.chai).to.be.ok
      @Cypress.trigger("stop")
      expect(@Cypress.chai).to.be.null
