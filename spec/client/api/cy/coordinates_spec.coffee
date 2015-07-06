describe "$Cypress.Cy Coordinates Extensions", ->
  enterCommandTestingMode()

  describe "coordinate calculations", ->
    beforeEach ->
      @$button = $("<button style='position: absolute; top: 25px; left: 50px; width: 100px; line-height: 50px; padding: 10px;'>foo</button>").appendTo @cy.$("body")

    context "#getElementAtCoordinates", ->
      it "returns same element based on x/y coords", ->
        expect(@cy.getElementAtCoordinates(100, 60).get(0)).to.eq @$button.get(0)

      it "does not return if element is hidden", ->
        @$button.hide()
        expect(@cy.getElementAtCoordinates(100, 60).get(0)).not.to.eq @$button.get(0)

      it "returns null if no element was found", ->
        expect(@cy.getElementAtCoordinates(1e9, 1e9)).to.be.null

    context "#getCenterCoordinates", ->
      it "returns center x/y including padding", ->
        ## padding is added to the line-height but width includes the padding
        expect(@cy.getCoordinates(@$button)).to.deep.eq {x: 100, y: 60}

      it "returns width / height factoring in rotation transforms", ->
        ## normally our outerWidth is 100 and outerHeight is 70
        ## after we've been rotated these are reversed and our previous
        ## calculation would be wrong. using getBoundingClientRect passes this test
        @$button.css({transform: "rotate(90deg)"})
        expect(@cy.getCoordinates(@$button)).to.deep.eq {x: 100, y: 60}
