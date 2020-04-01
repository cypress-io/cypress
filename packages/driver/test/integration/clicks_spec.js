/* eslint-disable
    brace-style,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Clicks Integration Tests', function () {
  context('fixed-nav', function () {
    enterCommandTestingMode('fixed-nav')

    return describe('fixed nav', () => {
      return it('can click inputs under a fixed-position nav', function () {
        return this.cy.get('button').click()
      })
    })
  })

  return context('dropdown', function () {
    enterCommandTestingMode('dropdown', { replaceIframeContents: false })

    return describe('animating dropdown with fixed background', () => // this tests a kendo drop down opening
    // as it opens the element from position returns the background element
    // which is fixed position
    // the fixed position element cannot be scrolled and thus an endless loop
    // is created
    {
      return it(
        'can click an animating element when the element behind it is fixed position and cannot be scrolled',
        function () {
          this.cy.window().then((win) => {
            const k = win.$('#dropdown').getKendoDropDownList()

            return k.open()
          })

          return this.cy
          .contains('.k-item', 'Strawberries').click()
          .window().then((win) => {
            const k = win.$('#dropdown').getKendoDropDownList()

            return expect(k.text()).to.eq('Strawberries')
          })
        },
      )
    })
  })
})
