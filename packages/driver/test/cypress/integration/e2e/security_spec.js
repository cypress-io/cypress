// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('security', () => {
  return it('works by replacing obstructive code', () => {
    cy.visit('/fixtures/security.html')

    return cy.get('div').should('not.exist')
  })
})
