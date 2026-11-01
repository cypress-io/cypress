// We modify the user agent to strip cypress and electron out of the user agent string to appear more chrome-like
// this only happens in electron and when the experimentalModifyObstructiveThirdPartyCode flag is set to true
describe('remote driver: user agent override in a cross-origin AUT', {
  experimentalRemoteDriver: true,
  browser: 'electron',
}, () => {
  const expectAutUserAgent = (userAgent: string) => {
    cy.document().its('defaultView.navigator.userAgent').should('equal', userAgent)
  }

  it('persists modified user agent after cy.visit', () => {
    cy.wrap(window.navigator.userAgent).as('userAgentBefore')
    cy.visit('/fixtures/primary-origin.html')
    cy.wrap(window.navigator.userAgent).then((userAgentAfter) => {
      cy.get('@userAgentBefore').then((userAgentBefore) => {
        expect(userAgentBefore).to.equal(userAgentAfter)
      })
    })
  })

  it('persists modified user agent after cy.reload', () => {
    cy.wrap(window.navigator.userAgent).as('userAgentBefore')
    cy.visit('/fixtures/primary-origin.html')
    cy.reload()
    cy.wrap(window.navigator.userAgent).then((userAgentAfter) => {
      cy.get('@userAgentBefore').then((userAgentBefore) => {
        expect(userAgentBefore).to.equal(userAgentAfter)
      })
    })
  })

  it('persists modified user agent after cy.go', () => {
    const userAgentBefore = window.navigator.userAgent

    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    expectAutUserAgent(userAgentBefore)

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy.go('back')
    cy.wrap(window.navigator.userAgent).should('equal', userAgentBefore)
    expectAutUserAgent(userAgentBefore)

    cy.go('forward')
    cy.wrap(window.navigator.userAgent).should('equal', userAgentBefore)
    expectAutUserAgent(userAgentBefore)
  })
})
