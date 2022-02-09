/* eslint-disable no-undef */
describe('ending early', () => {
  it('does not end early', () => {})

  it('does end early', (done) => {
    cy.noop({})
    .then(() => {
      return Cypress.Promise.delay(1000)
    }).noop({})
    .wrap({})

    return setTimeout(() => {
      return done()
    }
    , 500)
  })
})
