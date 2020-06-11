const { $ } = Cypress

export {}

describe('src/dom/coordinates', () => {
  let doc: Document

  before(() => {
    return cy
    .visit('/fixtures/generic.html')
    .then(function (win) {
      this.body = win.document.body.outerHTML
    })
  })

  beforeEach(function () {
    doc = cy.state('document')

    $(doc.body).empty().html(this.body)

    this.$button = $('<button style=\'position: absolute; top: 25px; left: 50px; width: 100px; line-height: 50px; padding: 10px; margin: 10px; border: 10px solid black\'>foo</button>')
    .appendTo(cy.$$('body'))
  })

  // this is necessary so that document.elementFromPoint
  // does not miss elements
  context('.getElementPositioning', () => {
    it('returns the leftCenter and topCenter normalized', function () {
      const win = Cypress.dom.getWindowByElement(this.$button.get(0))

      const scrollY = Object.getOwnPropertyDescriptor(win, 'scrollY')!
      const scrollX = Object.getOwnPropertyDescriptor(win, 'scrollX')!

      Object.defineProperty(win, 'scrollY', {
        value: 10,
      })

      Object.defineProperty(win, 'scrollX', {
        value: 20,
      })

      cy.stub(this.$button.get(0), 'getClientRects').returns([{
        top: 100.9,
        left: 60.9,
        width: 50,
        height: 40,
      }])

      const { fromElViewport, fromElWindow } = Cypress.dom.getElementPositioning(this.$button)

      expect(fromElViewport.topCenter).to.eq(120)
      expect(fromElViewport.leftCenter).to.eq(85)

      expect(fromElWindow.topCenter).to.eq(130)
      expect(fromElWindow.leftCenter).to.eq(105)

      Object.defineProperty(win, 'scrollY', scrollY)
      Object.defineProperty(win, 'scrollX', scrollX)
    })
  })

  context('.getCoordsByPosition', () => {
    it('rounds down x and y values to object', () => {
      expect(Cypress.dom.getCoordsByPosition(5.96, 7.68)).to.deep.eq({ x: 5, y: 7 })
    })
  })

  context('.getElementAtPointFromViewport', () => {
    it('returns same element based on x/y coords', function () {
      expect(Cypress.dom.getElementAtPointFromViewport(doc, 100, 60)).to.eq(this.$button.get(0))
    })

    it('does not return if element is hidden', function () {
      this.$button.hide()

      expect(Cypress.dom.getElementAtPointFromViewport(doc, 100, 60)).not.to.eq(this.$button.get(0))
    })

    it('returns null if no element was found', function () {
      expect(Cypress.dom.getElementAtPointFromViewport(doc, 1e9, 1e9)).to.be.null
    })
  })

  context('.getElementCoordinatesByPosition', () => {
    beforeEach(function () {
      this.fromElWindowPos = (pos) => {
        return Cypress.dom.getElementCoordinatesByPosition(this.$button, pos)
        .fromElWindow
      }
    })

    describe('topLeft', () => {
      it('returns top left x/y including padding + border', function () {
        const obj = this.fromElWindowPos('topLeft')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(35)
      })
    })

    describe('top', () => {
      it('returns top center x/y including padding + border', function () {
        const obj = this.fromElWindowPos('top')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(35)
      })
    })

    describe('topRight', () => {
      it('returns top right x/y including padding + border', function () {
        const obj = this.fromElWindowPos('topRight')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(35)
      })
    })

    describe('left', () => {
      it('returns center left x/y including padding + border', function () {
        const obj = this.fromElWindowPos('left')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(80)
      })
    })

    describe('center', () => {
      it('returns center x/y including padding + border', function () {
        const obj = this.fromElWindowPos()

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(80)
      })

      it('returns width / height factoring in rotation transforms', function () {
        // normally our outerWidth is 100 and outerHeight is 70
        // after we've been rotated these are reversed and our previous
        // calculation would be wrong. using getBoundingClientRect passes this test
        this.$button.css({ transform: 'rotate(90deg)' })

        const obj = this.fromElWindowPos()

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(80)
      })
    })

    describe('right', () => {
      it('returns center right x/y including padding + border', function () {
        const obj = this.fromElWindowPos('right')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(80)
      })
    })

    describe('bottomLeft', () => {
      it('returns bottom left x/y including padding + border', function () {
        const obj = this.fromElWindowPos('bottomLeft')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(60)
        expect(obj.y).to.eq(124)
      })
    })

    context('bottom', () => {
      it('returns bottom center x/y including padding + border', function () {
        const obj = this.fromElWindowPos('bottom')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(110)
        expect(obj.y).to.eq(124)
      })
    })

    context('bottomRight', () => {
      it('returns bottom right x/y including padding + border', function () {
        const obj = this.fromElWindowPos('bottomRight')

        // padding is added to the line-height but width includes the padding
        expect(obj.x).to.eq(159)
        expect(obj.y).to.eq(124)
      })
    })
  })

  context('span spanning multiple lines', () => {
    it('gets first dom rect in multiline text', () => {
      $(`\
<div style="width:150px; margin-top:100px"> \
this is some long text with a single <span id="multiple" style="color:darkblue"> span that spans lines</span> making it tricky to click \
</div>\
`).appendTo($('body'))

      const $el = cy.$$('#multiple')
      const el = $el[0]

      cy.stub(el, 'getClientRects', () => {
        return [
          {
            top: 100,
            left: 100,
            width: 50,
            height: 40,
          },
          {
            top: 200,
            left: 50,
            width: 10,
            height: 10,
          },
        ]
      }).as('getClientRects')

      const obj = Cypress.dom.getElementCoordinatesByPosition($el, 'center').fromElViewport

      expect({ x: obj.x, y: obj.y }).to.deep.eq({ x: 125, y: 120 })
    })
  })
})
