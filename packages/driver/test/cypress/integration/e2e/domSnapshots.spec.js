const { withMutableReporterState, findReactInstance, getCommandLogWithText } = require('../../support/utils')
const { $ } = Cypress

describe('rect highlight', () => {

  it('content highlight does not include padding', () => {
    cy.visit('/fixtures/dom.html')

    cy.get('button:first')

    cy.wait(0)
    // cy.wrap(null).should(() => {

    cy.then(() => {
      withMutableReporterState(() => {

        const commandLogEl = getCommandLogWithText('button:first')

        const reactCommandInstance = findReactInstance(commandLogEl)

        reactCommandInstance.props.appState.isRunning = false

        $(commandLogEl).find('.command-wrapper').click()
      })
    })

    cy.get('div[data-layer=Content]').should(($el) => {
      expectToBeInside($el[0].getBoundingClientRect(), cy.$$('div[data-layer=Border]')[0].getBoundingClientRect())
    })
  })
})

const expectToBeInside = (rectInner, rectOuter) => {
  Cypress.log({ name: 'assert', message: `Expected to be inside rect` })
  expect(rectInner.width, 'width').lte(rectOuter.width)
  expect(rectInner.height, 'height').lte(rectOuter.height)
  expect(rectInner.top, 'top').gte(rectOuter.top)
  expect(rectInner.left, 'left').gte(rectOuter.left)
  expect(rectInner.right, 'right').lte(rectOuter.right)
  expect(rectInner.bottom, 'bottom').lte(rectOuter.bottom)

}
