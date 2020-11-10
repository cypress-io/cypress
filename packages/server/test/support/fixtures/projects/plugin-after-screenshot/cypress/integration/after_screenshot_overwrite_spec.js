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
Cypress._.times(3, () => {
  it('cy.screenshot() - replacement', () => {
    return cy.screenshot('replace-me', { capture: 'runner' }, {
      onAfterScreenshot (details) {
        expect(details.path).to.include('screenshot-replacement.png')
        expect(details.size).to.equal(1047)

        expect(details.dimensions).to.eql({ width: 1, height: 1 })
      },
    })
  })
})
