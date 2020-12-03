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
describe('localhost', () => {
  it('can visit', () => {
    return cy.visit('http://app.localhost:4848')
  })
})

describe('com.au', () => {
  it('can visit', () => {
    return cy.visit('http://foo.bar.baz.com.au:4848')
  })
})

describe('herokuapp.com', () => {
  it('can visit', () => {
    cy.visit('https://cypress-example.herokuapp.com')

    return cy.contains('Getting Started with Node on Heroku')
  })
})
