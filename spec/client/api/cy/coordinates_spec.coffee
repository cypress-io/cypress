describe "$Cypress.Cy Coordinates Extensions", ->
  enterCommandTestingMode()

  context "#getCoordinates", ->
    beforeEach ->
      @$button = $("<button style='position: absolute; top: 25px; left: 50px; width: 100px; line-height: 50px; padding: 10px;'>foo</button>").appendTo @cy.$("body")

    it "returns center x/y including padding", ->
      ## padding is added to the line-height but width includes the padding
      expect(@cy.getCenterCoordinates(@$button)).to.deep.eq {x: 100, y: 60}

    it "returns same element based on x/y coords", ->
      expect(@cy.getElementAtCoordinates(100, 60).get(0)).to.eq @$button.get(0)

    it "does not return if element is hidden", ->
      @$button.hide()
      expect(@cy.getElementAtCoordinates(100, 60).get(0)).not.to.eq @$button.get(0)
