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
describe('simple hooks spec', () => {
  before(() => {
    return cy.wait(100)
  })

  beforeEach(() => {
    return cy.wait(200)
  })

  afterEach(() => {
    return cy.wait(200)
  })

  after(() => {
    return cy.wait(100)
  })

  it('t1', () => {
    return cy.wrap('t1').should('eq', 't1')
  })

  it('t2', () => {
    return cy.wrap('t2').should('eq', 't2')
  })

  it('t3', () => {
    return cy.wrap('t3').should('eq', 't3')
  })
})
