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
describe('user agent', () => {
  it('is set on visits', () => {
    cy.visit('/agent')

    return cy.get('#agent').should('contain', 'foo bar baz agent')
  })

  it('is set on requests', () => {
    return cy
    .request('PUT', '/agent')
    .its('body').should('deep.eq', {
      userAgent: 'foo bar baz agent',
    })
  })
})
