$ = Cypress.$.bind(Cypress)

describe "src/dom/coordinates", ->
  before ->
    cy
      .visit("/fixtures/generic.html")
      .then (win) ->
        @body = win.document.body.outerHTML

  beforeEach ->
    @doc = cy.state("document")

    $(@doc.body).empty().html(@body)

    @$button = $("<button style='position: absolute; top: 25px; left: 50px; width: 100px; line-height: 50px; padding: 10px; margin: 10px; border: 10px solid black'>foo</button>")
    .appendTo(cy.$$("body"))

  context ".normalizeCoords", ->
    it "rounds down x and y values to object", ->
      expect(Cypress.dom.normalizeCoords(5.96, 7.68)).to.deep.eq({left: 5, top: 7})

  context ".getElementAtPointFromViewport", ->
    it "returns same element based on x/y coords", ->
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 100, 60)).to.eq @$button.get(0)

    it "does not return if element is hidden", ->
      @$button.hide()
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 100, 60)).not.to.eq @$button.get(0)

    it "returns null if no element was found", ->
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 1e9, 1e9)).to.be.null

  context ".getElementCoordinatesByPosition", ->
    describe "topLeft", ->
      it "returns top left x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "topLeft").fromWindow).to.deep.eq {left: 60, top: 35}

    describe "top", ->
      it "returns top center x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "top").fromWindow).to.deep.eq {left: 110, top: 35}

    describe "topRight", ->
      it "returns top right x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "topRight").fromWindow).to.deep.eq {left: 159, top: 35}

    describe "left", ->
      it "returns center left x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "left").fromWindow).to.deep.eq {left: 60, top: 80}

    describe "center", ->
      it "returns center x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button).fromWindow).to.deep.eq {left: 110, top: 80}

      it "returns width / height factoring in rotation transforms", ->
        ## normally our outerWidth is 100 and outerHeight is 70
        ## after we've been rotated these are reversed and our previous
        ## calculation would be wrong. using getBoundingClientRect passes this test
        @$button.css({transform: "rotate(90deg)"})
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button).fromWindow).to.deep.eq {left: 110, top: 80}

    describe "right", ->
      it "returns center right x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "right").fromWindow).to.deep.eq {left: 159, top: 80}

    describe "bottomLeft", ->
      it "returns bottom left x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "bottomLeft").fromWindow).to.deep.eq {left: 60, top: 124}

    context "bottom", ->
      it "returns bottom center x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "bottom").fromWindow).to.deep.eq {left: 110, top: 124}

    context "bottomRight", ->
      it "returns bottom right x/y including padding + border", ->
        ## padding is added to the line-height but width includes the padding
        expect(Cypress.dom.getElementCoordinatesByPosition(@$button, "bottomRight").fromWindow).to.deep.eq {left: 159, top: 124}
