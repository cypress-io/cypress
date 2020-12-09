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
let onBeforeLoad
let onLoad = (onBeforeLoad = null)

Cypress.Commands.overwrite('visit', (originalVisit, url, options) => {
  onBeforeLoad = cy.stub().as('onBeforeLoad')
  onLoad = cy.stub().as('onLoad')

  return originalVisit(url, { onBeforeLoad, onLoad })
})

context('issue #2196: overwriting visit', () => {
  it('fires onBeforeLoad', () => {
    return cy
    .visit('http://localhost:3434/index.html')
    .then(() => {
      expect(onBeforeLoad).to.be.called

      expect(onLoad).to.be.called
    })
  })
})
