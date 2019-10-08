const { withMutableReporterState, findReactInstance, getCommandLogWithText } = require('../../support/utils')
const { $ } = Cypress

describe('rect highlight', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('highlight elements are properly positioned', () => {
    cy.$$('button:first').css({ boxSizing: 'content-box' })

    getAndPin('button:first')

    shouldHaveCorrectHighlightPositions('button:first')
  })

  it('highlight elements properly positioned for content-box', () => {
    getAndPin('button.content-box:first')

    shouldHaveCorrectHighlightPositions()
  })

  it('highlight inline elements', () => {
    cy.$$('<span>foo</span>').prependTo(cy.$$('body'))

    getAndPin('span:first')

    shouldHaveCorrectHighlightPositions('span:first')
  })

  it('highlight elements with css transform', () => {
    cy.$$('button:first').css({ transform: 'scale(1.5) rotate(45deg)' })

    getAndPin('button:first')

    shouldHaveCorrectHighlightPositions('button:first')
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
    shouldHaveCorrectHighlightPositions(null)
  })
})

const getAndPin = (sel) => {
  cy.get(sel)

  cy.wait(0)
  .then(() => {
    withMutableReporterState(() => {

      const commandLogEl = getCommandLogWithText(sel)

      const reactCommandInstance = findReactInstance(commandLogEl)

      reactCommandInstance.props.appState.isRunning = false

      $(commandLogEl).find('.command-wrapper').click()
    })
  })
}

const shouldHaveCorrectHighlightPositions = (sel) => {
  return cy.wrap(null, { timeout: 400 }).should(() => {
    const dims = {
      content: cy.$$('div[data-layer=Content]')[0].getBoundingClientRect(),
      padding: cy.$$('div[data-layer=Padding]')[0].getBoundingClientRect(),
      border: cy.$$('div[data-layer=Border]')[0].getBoundingClientRect(),
    }

    expectToBeInside(dims.content, dims.padding, 'content to be inside padding')
    expectToBeInside(dims.padding, dims.border, 'padding to be inside border')
    if (sel) {
      // assert convering bounding-box of element
      expectToBeEqual(dims.border, cy.$$(sel)[0].getBoundingClientRect(), 'border-box to match selector bounding-box')
    }
  })
}

const expectToBeEqual = (rect1, rect2, mes = 'rect to be equal to rect') => {
  try {
    expect(Math.floor(rect1.width), 'width').eq(Math.floor(rect2.width))
    expect(Math.floor(rect1.height), 'height').eq(Math.floor(rect2.height))
    expect(Math.floor(rect1.top), 'top').eq(Math.floor(rect2.top))
    expect(Math.floor(rect1.left), 'left').eq(Math.floor(rect2.left))
    expect(Math.floor(rect1.right), 'right').eq(Math.floor(rect2.right))
    expect(Math.floor(rect1.bottom), 'bottom').eq(Math.floor(rect2.bottom))
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
