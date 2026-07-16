/* eslint-disable no-undef */
// NOTE: Chrome is deprecating HTTP/2 server push in favor of preload / 103 Early Hints.
// https://developer.chrome.com/blog/removing-push
const ORIGIN = 'https://www.h2test.local:44701'

describe('http2 server push intercept', () => {
  it('can spy on a push-promised resource', () => {
    cy.intercept('GET', `${ORIGIN}/push/pushed.js`).as('pushed')
    cy.visit(`${ORIGIN}/push-page`)
    cy.wait('@pushed').its('response.statusCode').should('eq', 200)
    cy.get('#result').should('contain', 'pushed')
  })
})
