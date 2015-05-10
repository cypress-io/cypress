describe "$Cypress.Cy Ready Events", ->
  enterCommandTestingMode()

  describe "beforeunload", ->
    beforeEach ->
      @isReady = @sandbox.spy @cy, "isReady"
      @a = $("<a id='change-page' href='/timeout?ms=200'>foo</a>").appendTo @cy.$("body")

    it "sets isReady to false", ->
      ## when we click the a it should synchronously fire
      ## the beforeunload event which we then set isReady to false
      @cy.inspect().get("a#change-page").click().then ->
        expect(@isReady).to.be.calledWith false, "beforeunload"

    it "does not set isReady if beforeunload has a return value", ->
      ## stub this so the actual beforeunload prompt doesnt show up!
      @sandbox.stub(@cy, "_eventHasReturnValue").returns(true)

      ## when we click the a it should synchronously fire
      ## the beforeunload event which we then set isReady to false
      @cy.inspect().get("a#change-page").click().then ->
        expect(@isReady).not.to.be.calledWith false