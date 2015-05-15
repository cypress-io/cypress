describe "Cookies Integration Tests", ->
  enterCommandTestingMode("html/cookies")

  context "cookies", ->
    it "sets initial=true on beforeload", ->
      expect(Cookies.get("__cypress.initial")).to.be.undefined

      ## this navigates us to a new page so
      ## we should be setting the initial cookie
      @cy.inspect().get("a").click().then ->
        expect(Cookies.get("__cypress.initial")).to.eq("true")