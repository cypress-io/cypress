const { clickCommandLog } = require('../../support/utils')

describe('rect highlight', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  it('highlight elements are properly positioned', () => {
    getAndPin('button:first')

    shouldHaveCorrectHighlightPositions()
  })

  it('highlight elements properly positioned for content-box', () => {
    getAndPin('button.content-box:first')

    shouldHaveCorrectHighlightPositions()
  })

  // https://github.com/cypress-io/cypress/issues/5295
  it('replaces iframe with placeholder content', () => {
    cy.$$('iframe:first').css({ padding: 0, width: '600px' })
    getAndPin('iframe:first')

    // NOTE: possibly switch to visual screenshot diffing in future
    // since data: iframes are considered cross-origin and we cannot
    // query into them and assert on contents
    // e.g. cy.get('iframe:first').toMatchScreenshot()

    // For now we parse the src attr and assert on base64 encoded content
    cy.get('iframe:first').then(($iframe) => {
      const html = $iframe.attr('src')

      expect(atob(html.split(',')[1])).to.contain('placeholder')
    })
  })
})

const shouldHaveCorrectHighlightPositions = () => {
  return cy.wrap(null, { timeout: 400 }).should(() => {
    const dims = {
      content: cy.$$('div[data-layer=Content]')[0].getBoundingClientRect(),
      padding: cy.$$('div[data-layer=Padding]')[0].getBoundingClientRect(),
      border: cy.$$('div[data-layer=Border]')[0].getBoundingClientRect(),
    }

    expectToBeInside(dims.content, dims.padding, 'content to be inside padding')
    expectToBeInside(dims.padding, dims.border, 'padding to be inside border')
  })
}

const getAndPin = (sel) => {
  cy.get(sel)
  clickCommandLog(sel)
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
