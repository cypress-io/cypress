const { withMutableReporterState, findReactInstance, getCommandLogWithText } = require('../../support/utils')
const { $ } = Cypress

// https://github.com/cypress-io/cypress/pull/5299/files
describe('rect highlight', () => {
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
})

const getAndPin = (sel) => {
  cy.get(sel)

  // TODO: fix me @brian-mann plz halp ;-(
  // arbitrary wait to allow clicking and pinning command
  // if reduced, test is flakey
  cy.wait(10)
  .should(() => {
    withMutableReporterState(() => {

      const commandLogEl = getCommandLogWithText(sel)

      const reactCommandInstance = findReactInstance(commandLogEl)

      reactCommandInstance.props.appState.isRunning = false

      $(commandLogEl).find('.command-wrapper').click()

      // make sure command was pinned, otherwise throw a better error message
      expect(cy.$$('.command-pin:visible', top.document).length, 'command should be pinned').ok
    })
  })
}

const ensureCorrectHighlightPositions = (sel) => {
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
