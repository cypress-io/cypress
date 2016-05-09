describe "$Cypress.Cy Coordinates Extensions", ->
  enterCommandTestingMode()

  describe "coordinate calculations", ->
    beforeEach ->
      @$button = $("<button style='position: absolute; top: 25px; left: 50px; width: 100px; line-height: 50px; padding: 10px; margin: 10px; border: 10px solid black'>foo</button>").appendTo @cy.$$("body")

    context "normalizeCoords", ->
      it "rounds down x and y values to object", ->
        expect(@cy.normalizeCoords(5.96, 7.68)).to.deep.eq({x: 5, y: 7})

    context "#getElementAtCoordinates", ->
      it "returns same element based on x/y coords", ->
        expect(@cy.getElementAtCoordinates(100, 60).get(0)).to.eq @$button.get(0)

      it "does not return if element is hidden", ->
        @$button.hide()
        expect(@cy.getElementAtCoordinates(100, 60).get(0)).not.to.eq @$button.get(0)

      it "returns null if no element was found", ->
        expect(@cy.getElementAtCoordinates(1e9, 1e9)).to.be.null

    context "#getBoundingClientRect", ->

    context "#getCenterCoordinates", ->
      it "returns center x, y coord", ->
        expect(@cy.getCenterCoordinates({top: 35.56, left: 60.43, width: 100, height: 90})).to.deep.eq {x: 110, y: 80}

    context "#getTopLeftCoordinates", ->
      it "returns top left x, y coord", ->
        expect(@cy.getTopLeftCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 101, y: 201}

    context "#getTopRightCoordinates", ->
      it "returns top right x, y coord", ->
        expect(@cy.getTopRightCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 199, y: 201}

    context "#getBottomLeftCoordinates", ->
      it "returns bottom left x, y coord", ->
        expect(@cy.getBottomLeftCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 101, y: 299}

    context "#getBottomRightCoordinates", ->
      it "returns bottom right x, y coord", ->
        expect(@cy.getBottomRightCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 199, y: 299}


    context "#getCoordinates", ->
      context "center", ->
        it "returns center x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button)).to.deep.eq {x: 110, y: 80}

        it "returns width / height factoring in rotation transforms", ->
          ## normally our outerWidth is 100 and outerHeight is 70
          ## after we've been rotated these are reversed and our previous
          ## calculation would be wrong. using getBoundingClientRect passes this test
          @$button.css({transform: "rotate(90deg)"})
          expect(@cy.getCoordinates(@$button)).to.deep.eq {x: 110, y: 80}

      context "topLeft", ->
        it "returns top left x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "topLeft")).to.deep.eq {x: 60, y: 35}

      context "topRight", ->
        it "returns top right x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "topRight")).to.deep.eq {x: 159, y: 35}

      context "bottomLeft", ->
        it "returns bottom left x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "bottomLeft")).to.deep.eq {x: 60, y: 124}

      context "bottomRight", ->
        it "returns bottom right x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "bottomRight")).to.deep.eq {x: 159, y: 124}