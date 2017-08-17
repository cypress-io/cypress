{ $ } = window.testUtils

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

    context "#getTopLeftCoordinates", ->
      it "returns top left x, y coord", ->
        expect(@cy.getTopLeftCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 101, y: 201}

    context "#getTopCoordinates", ->
      it "returns top center x, y coord", ->
        expect(@cy.getTopCoordinates({top: 200.75, left: 60.43, width: 100, height: 100})).to.deep.eq {x: 110, y: 201}

    context "#getTopRightCoordinates", ->
      it "returns top right x, y coord", ->
        expect(@cy.getTopRightCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 199, y: 201}

    context "#getLeftCoordinates", ->
      it "returns center left x, y coord", ->
        expect(@cy.getLeftCoordinates({top: 35.56, left: 100.75, width: 100, height: 90})).to.deep.eq {x: 101, y: 80}

    context "#getCenterCoordinates", ->
      it "returns center x, y coord", ->
        expect(@cy.getCenterCoordinates({top: 35.56, left: 60.43, width: 100, height: 90})).to.deep.eq {x: 110, y: 80}

    context "#getRightCoordinates", ->
      it "returns center right x, y coord", ->
        expect(@cy.getRightCoordinates({top: 35.56, left: 100.75, width: 100, height: 90})).to.deep.eq {x: 199, y: 80}

    context "#getBottomLeftCoordinates", ->
      it "returns bottom left x, y coord", ->
        expect(@cy.getBottomLeftCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 101, y: 299}

    context "#getBottomCoordinates", ->
      it "returns bottom center x, y coord", ->
        expect(@cy.getBottomCoordinates({top: 200.75, left: 60.43, width: 100, height: 100})).to.deep.eq {x: 110, y: 299}

    context "#getBottomRightCoordinates", ->
      it "returns bottom right x, y coord", ->
        expect(@cy.getBottomRightCoordinates({top: 200.75, left: 100.75, width: 100, height: 100})).to.deep.eq {x: 199, y: 299}

    context "#getCoordinates", ->
      context "throws when unrecognized", ->
        it "throws error on foo", ->
          fn = => @cy.getCoordinates(@$button, "foo")

          expect(fn).to.throw('Invalid position argument: \'foo\'. Position may only be topLeft, top, topRight, left, center, right, bottomLeft, bottom, bottomRight.')

      context "topLeft", ->
        it "returns top left x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "topLeft")).to.deep.eq {x: 60, y: 35}

      context "top", ->
        it "returns top center x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "top")).to.deep.eq {x: 110, y: 35}

      context "topRight", ->
        it "returns top right x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "topRight")).to.deep.eq {x: 159, y: 35}

      context "left", ->
        it "returns center left x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "left")).to.deep.eq {x: 60, y: 80}

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

      context "right", ->
        it "returns center right x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "right")).to.deep.eq {x: 159, y: 80}

      context "bottomLeft", ->
        it "returns bottom left x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "bottomLeft")).to.deep.eq {x: 60, y: 124}

      context "bottom", ->
        it "returns bottom center x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "bottom")).to.deep.eq {x: 110, y: 124}

      context "bottomRight", ->
        it "returns bottom right x/y including padding + border", ->
          ## padding is added to the line-height but width includes the padding
          expect(@cy.getCoordinates(@$button, "bottomRight")).to.deep.eq {x: 159, y: 124}
