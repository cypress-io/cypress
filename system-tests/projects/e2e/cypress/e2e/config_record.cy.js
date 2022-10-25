Cypress.config('defaultCommandTimeout', 1111)
Cypress.config('pageLoadTimeout', 2222)
describe('record pass', { defaultCommandTimeout: 1234 }, () => {
  Cypress.config('pageLoadTimeout', 3333)
  it('passes', { env: { foo: true }, retries: 2 }, () => {
    Cypress.config('defaultCommandTimeout', 4444)
    cy.visit('/scrollable.html')
    cy.viewport(400, 400)
    cy.get('#box')
    cy.screenshot('yay it passes')
  })

  it('is pending')

  // eslint-disable-next-line
  it.skip('is pending due to .skip', () => {
    console.log('stuff')
  })

  it('is skipped due to browser', { browser: 'edge' }, () => {})
})

describe('record pass', { browser: 'edge', requestTimeout: 5500 }, () => {
  it('is skipped due to browser at suite level', { defaultCommandTimeout: 3000 }, () => {})
  it('is also skipped due to browser at suite level', { requestTimeout: 100 }, () => {
    cy.get('div')
  })
})
