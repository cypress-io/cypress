/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('Type Integration Tests', () => {
  return context('type', function () {
    enterCommandTestingMode('type')

    return describe('card.js', () => {
      return it('it correctly changes the caret position and value of card expiration', function () {
        return this.cy
        .window().then((win) => {
          return win.$('form').card({
            container: '#card-container',
          })
        }).get('[name=\'expiry\']')
        .type('0314')
        .should('have.value', '03 / 14')
      })
    })
  })
})
