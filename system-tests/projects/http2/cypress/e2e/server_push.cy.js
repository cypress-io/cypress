/* eslint-disable no-undef */
// NOTE: Chrome is deprecating HTTP/2 server push in favor of preload / 103 Early Hints.
// https://developer.chrome.com/blog/removing-push
const ORIGIN = 'https://www.h2test.local:44701'

describe('http2 server push', () => {
  it('loads a push-promised script before the page finishes', () => {
    cy.visit(`${ORIGIN}/push-page`)
    cy.get('#result', { timeout: 10000 }).should('contain', 'pushed')
  })
})
