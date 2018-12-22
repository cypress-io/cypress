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

  context ".getElementPositioning", ->
    ## this is necessary so that document.elementFromPoint
    ## does not miss elements
    it "returns the leftCenter and topCenter normalized", ->
      win = Cypress.dom.getWindowByElement(@$button.get(0))

      pageYOffset = Object.getOwnPropertyDescriptor(win, "pageYOffset")
      pageXOffset = Object.getOwnPropertyDescriptor(win, "pageXOffset")

      Object.defineProperty(win, "pageYOffset", {
        value: 10
      })

      Object.defineProperty(win, "pageXOffset", {
        value: 20
      })

      cy.stub(@$button.get(0), "getClientRects").returns([{
        top: 100.9
        left: 60.9
        width: 50
        height: 40
      }])

      { fromViewport, fromWindow } = Cypress.dom.getElementPositioning(@$button)

      expect(fromViewport.topCenter).to.eq(120)
      expect(fromViewport.leftCenter).to.eq(85)

      expect(fromWindow.topCenter).to.eq(130)
      expect(fromWindow.leftCenter).to.eq(105)

      Object.defineProperty(win, "pageYOffset", pageYOffset)
      Object.defineProperty(win, "pageXOffset", pageXOffset)

  context ".getCoordsByPosition", ->
    it "rounds down x and y values to object", ->
      expect(Cypress.dom.getCoordsByPosition(5.96, 7.68)).to.deep.eq({x: 5, y: 7})

  context ".getElementAtPointFromViewport", ->
    it "returns same element based on x/y coords", ->
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 100, 60)).to.eq @$button.get(0)

    it "does not return if element is hidden", ->
      @$button.hide()
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 100, 60)).not.to.eq @$button.get(0)

    it "returns null if no element was found", ->
      expect(Cypress.dom.getElementAtPointFromViewport(@doc, 1e9, 1e9)).to.be.null

  context ".getElementCoordinatesByPosition", ->
    beforeEach ->
      @fromWindowPos = (pos) =>
        Cypress.dom.getElementCoordinatesByPosition(@$button, pos)
        .fromWindow

    describe "topLeft", ->
      it "returns top left x/y including padding + border", ->
        obj = @fromWindowPos("topLeft")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(35)

    describe "top", ->
      it "returns top center x/y including padding + border", ->
        obj = @fromWindowPos("top")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(35)

    describe "topRight", ->
      it "returns top right x/y including padding + border", ->
        obj = @fromWindowPos("topRight")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(35)

    describe "left", ->
      it "returns center left x/y including padding + border", ->
        obj = @fromWindowPos("left")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(80)

    describe "center", ->
      it "returns center x/y including padding + border", ->
        obj = @fromWindowPos()

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(80)

      it "returns width / height factoring in rotation transforms", ->
        ## normally our outerWidth is 100 and outerHeight is 70
        ## after we've been rotated these are reversed and our previous
        ## calculation would be wrong. using getBoundingClientRect passes this test
        @$button.css({transform: "rotate(90deg)"})

        obj = @fromWindowPos()

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(80)

    describe "right", ->
      it "returns center right x/y including padding + border", ->
        obj = @fromWindowPos("right")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(80)

    describe "bottomLeft", ->
      it "returns bottom left x/y including padding + border", ->
        obj = @fromWindowPos("bottomLeft")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(124)

    context "bottom", ->
      it "returns bottom center x/y including padding + border", ->
        obj = @fromWindowPos("bottom")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(124)

    context "bottomRight", ->
      it "returns bottom right x/y including padding + border", ->
        obj = @fromWindowPos("bottomRight")

        ## padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(124)

  context "span spanning multiple lines", ->
    it 'gets first dom rect in multiline text', ->
      $ '
      <div style="width:150px; margin-top:100px">
      this is some long text with a single <span id="multiple" style="color:darkblue"> span that spans lines</span> making it tricky to click
      </div>
      '
      .appendTo $ 'body'

      $el = cy.$$("#multiple")
      el = $el[0]

      cy.stub(el, 'getClientRects', ->
        [
          {
          top: 100
          left: 100
          width: 50
          height: 40
          },
          {
          top: 200
          left: 50
          width: 10
          height: 10
          }
      ]

      ).as 'getClientRects'
      obj = Cypress.dom.getElementCoordinatesByPosition($el, 'center').fromViewport

      expect({x: obj.x, y: obj.y}).to.deep.eq({x:125, y:120})
