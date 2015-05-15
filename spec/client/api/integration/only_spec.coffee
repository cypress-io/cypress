describe ".Only Integration Tests", ->
  enterIntegrationTestingMode("html/only")

  context "onlys", ->
    beforeEach ->
      @Cypress.chai.restore()

    it "Cypress.runner should be grep'd for s1 t3", ->
      expect(@Cypress.runner.runner._grep).to.deep.eq /^s1 t3$/
