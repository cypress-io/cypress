describe('selector_playground', () => {
  it('draws rect over currently hovered element', () => {
    cy.visit('/fixtures/dom.html')
    .then(() => {
      // We trick the selector-playground into rendering while the test is running
      top.Runner.configureMobx({ enforceActions: 'never' })
      top.Runner.state.isRunning = false

      const $highlightBtn = cy.$$('button.highlight-toggle:visible', top.document)

      if (!$highlightBtn.length) {
        const $btn = cy.$$('button.selector-playground-toggle', top.document)

        $btn.click()
      } else {
        if (!$highlightBtn.hasClass('active')) {
          $highlightBtn.click()
        }
      }

      cy.get('input:first')
      .trigger('mousemove', { force: true })
      .should(expectToBeCovered)
    })
  })
})

/**
 *
 * @param {JQuery<HTMLElement>} $el
 */
const expectToBeCovered = ($el) => {
  const el = $el[0]
  const rect = el.getBoundingClientRect()

  const elAtPoint = el.ownerDocument.elementFromPoint(rect.left, rect.top)

  expect(el).not.eq(elAtPoint)
}
