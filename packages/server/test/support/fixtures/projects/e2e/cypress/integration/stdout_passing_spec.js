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
describe('stdout_passing_spec', () => {
  context('file', () => {
    it('visits file', () => {
      return cy.visit('/index.html')
    })
  })

  context('google', () => {
    it('visits google', () => {
      return cy.visit('https://www.google.com')
    })

    it('google2', () => {})
  })

  context('apple', () => {
    it('apple1', () => {})

    it('visits apple', () => {
      return cy.visit('https://www.apple.com')
    })
  })

  context('subdomains', () => {
    it('cypress1', () => {})

    it('visits cypress', () => {
      return cy
      .visit('https://www.cypress.io')
      .visit('https://docs.cypress.io')
    })

    it('cypress3', () => {})
  })
})
