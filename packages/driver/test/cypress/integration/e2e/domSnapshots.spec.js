const { withMutableReporterState, findReactInstance, getCommandLogWithText } = require('../../support/utils')
const { $ } = Cypress

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

describe('rect highlight', () => {
  it('highlight elements are properly positioned', () => {
    cy.visit('/fixtures/dom.html')

    getAndPin('button:first')

    cy.wrap(null, { timeout: 400 }).should(() => {
      const dims = {
        content: cy.$$('div[data-layer=Content]')[0].getBoundingClientRect(),
        padding: cy.$$('div[data-layer=Padding]')[0].getBoundingClientRect(),
        border: cy.$$('div[data-layer=Border]')[0].getBoundingClientRect(),
      }

      expectToBeInside(dims.content, dims.padding, 'content to be inside padding')
      expectToBeInside(dims.padding, dims.border, 'padding to be inside border')
    })
  })

  it('highlight elements properly positioned for content-box', () => {
    cy.visit('/fixtures/dom.html')

    getAndPin('button.content-box:first')

    cy.wrap(null, { timeout: 400 }).should(() => {
      const dims = {
        content: cy.$$('div[data-layer=Content]')[0].getBoundingClientRect(),
        padding: cy.$$('div[data-layer=Padding]')[0].getBoundingClientRect(),
        border: cy.$$('div[data-layer=Border]')[0].getBoundingClientRect(),
      }

      expectToBeInside(dims.content, dims.padding, 'content to be inside padding')
      expectToBeInside(dims.padding, dims.border, 'padding to be inside border')
    })
  })
})

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
