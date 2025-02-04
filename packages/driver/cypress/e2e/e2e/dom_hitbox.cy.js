const { clickCommandLog } = require('../../support/utils')
const { _ } = Cypress

// https://github.com/cypress-io/cypress/pull/5299/files
// TODO(webkit): fix+unskip for experimental webkit
describe('rect highlight', { browser: '!webkit' }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('highlight elements are properly positioned', () => {
    cy.$$('button:first').css({ boxSizing: 'content-box' })

    getAndPin('button:first')

    ensureCorrectHighlightPositions('button:first')
  })

  it('highlight elements properly positioned for content-box', () => {
    getAndPin('button.content-box:first')

    ensureCorrectHighlightPositions()
  })

  it('highlight inline elements', () => {
    cy.$$('<span>foo</span>').prependTo(cy.$$('body'))

    getAndPin('span:first')

    ensureCorrectHighlightPositions('span:first')
  })

  it('highlight elements with css transform', () => {
    cy.$$('button:first').css({ transform: 'scale(1.5) rotate(45deg)' })

    getAndPin('button:first')

    ensureCorrectHighlightPositions('button:first')
  })

  it('highlight elements with css transform on parent', () => {
    cy.$$('<div id="parent">parent<div id="child">child</div></div>').css({
      transform: 'scale(1.5) rotate(45deg) translate(100px, 20px)',
      height: 40,
      width: 60,
    })
    .prependTo(cy.$$('body'))

    getAndPin('#child')

    // TODO: assert covers element bounding-box
    ensureCorrectHighlightPositions(null)
  })

  it('correct target position during click', () => {
    clickAndPin('#button')
    // TODO: We are currently skipping the element comparison on the highlight.
    // What looks to be occurring, is that the DOM reference fetched in elementFromPoint
    // is a stale detached DOM reference of the highlight container over the button.
    // In React 17, the "elementFromPoint" and "div[data-layer=Content]" share the same reference.
    // Since updating the Reporter to React 18, this is no longer the case. The element looks to be rerendered
    // and the previous reference detached. We will need to come up with a different way to test this.
    // @see https://github.com/cypress-io/cypress/issues/30526.
    ensureCorrectHighlightPositions('#button', true)
    ensureCorrectTargetPosition('#button')
  })

  it('correct target position during click with offset coords', () => {
    clickAndPin('#button', 5, 10)
    ensureCorrectHighlightPositions('#button')
    ensureCorrectTargetPosition('#button')
  })

  // https://github.com/cypress-io/cypress/issues/7762
  it('highlights above z-index elements', () => {
    cy.$$('<div id="absolute-el"></div>').css({
      position: 'absolute',
      zIndex: 1000,
      top: 0,
      left: 0,
      height: 50,
      width: 50,
      padding: 20,
      margin: 20,
      backgroundColor: 'salmon',
    }).appendTo(cy.$$('body'))

    getAndPin('#absolute-el')
    ensureCorrectHighlightPositions('#absolute-el')
  })
})

const ensureCorrectTargetPosition = (sel) => {
  return cy.wrap(null, { timeout: 4000 }).should(() => {
    const target = cy.$$('div[data-highlight-hitbox]')[0].getBoundingClientRect()

    const dims = {
      left: target.left + target.width / 2,
      right: target.left + target.width / 2,
      top: target.top + target.height / 2,
      bottom: target.top + target.height / 2,
      width: 1,
      height: 1,
    }

    expectToBeInside(dims, cy.$$(sel)[0].getBoundingClientRect(), 'border-box to match selector bounding-box')
  })
}

const ensureCorrectHighlightPositions = (sel, skipElementComparison) => {
  return cy.wrap(null, { timeout: 4000 }).should(() => {
    const els = {
      content: cy.$$('div[data-layer=Content]'),
      padding: cy.$$('div[data-layer=Padding]'),
      border: cy.$$('div[data-layer=Border]'),
    }

    const dims = _.mapValues(els, ($el) => {
      return $el[0].getBoundingClientRect()
    })

    if (!skipElementComparison) {
      const doc = els.content[0].ownerDocument

      const contentHighlightCenter = [dims.content.x + dims.content.width / 2, dims.content.y + dims.content.height / 2]
      const highlightedEl = doc.elementFromPoint(...contentHighlightCenter)

      expect(highlightedEl).eq(els.content[0])
    }

    expectToBeInside(dims.content, dims.padding, 'content to be inside padding')
    expectToBeInside(dims.padding, dims.border, 'padding to be inside border')
    if (sel) {
      // assert converting bounding-box of element
      expectToBeEqual(dims.border, cy.$$(sel)[0].getBoundingClientRect(), 'border-box to match selector bounding-box')
    }
  })
}

const getAndPin = (sel) => {
  cy.get(sel)

  clickCommandLog(sel, 'message-text')
}

const clickAndPin = (sel, ...args) => {
  cy.get(sel).click(...args)

  clickCommandLog('click')
}

const expectToBeEqual = (rect1, rect2, mes = 'rect to be equal to rect') => {
  try {
    expect(rect1.width, 'width').to.be.closeTo(rect2.width, 1)
    expect(rect1.height, 'height').to.be.closeTo(rect2.height, 1)
    expect(rect1.top, 'top').to.be.closeTo(rect2.top, 1)
    expect(rect1.left, 'left').to.be.closeTo(rect2.left, 1)
    expect(rect1.right, 'right').to.be.closeTo(rect2.right, 1)
    expect(rect1.bottom, 'bottom').to.be.closeTo(rect2.bottom, 1)
  } catch (e) {
    e.message = `\nExpected ${mes}\n${e.message}`
    throw e
  }
}

const expectToBeInside = (rectInner, rectOuter, mes = 'rect to be inside rect') => {
  try {
    expect(rectInner.width, 'width').lte(rectOuter.width)
    expect(rectInner.height, 'height').lte(rectOuter.height)
    expect(rectInner.top, 'top').gte(rectOuter.top)
    expect(rectInner.left, 'left').gte(rectOuter.left)
    expect(rectInner.right, 'right').lte(rectOuter.right)
    expect(rectInner.bottom, 'bottom').lte(rectOuter.bottom)
  } catch (e) {
    e.message = `\nExpected ${mes}\n${e.message}`
    throw e
  }
}
