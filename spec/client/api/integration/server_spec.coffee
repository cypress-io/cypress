describe "Server Integration Tests", ->
  enterIntegrationTestingMode("html/server")

  context "server starting prior to visit", ->
    beforeEach ->
      @currentTest.timeout(5000)
      @Cypress.chai.restoreAsserts()

    it "Cypress.runner should be grep'd for s1 t3", (done) ->
      ## to REALLY test this properly instead of using a
      ## cy.visit inside of the server.html (which just replaces
      ## the iframe with sinon.html) we need to actually separate
      ## the test into 2 iframes (which matches how it really works)

      @Cypress.run (failures) ->
        expect(failures).to.eq(0)
        done()
