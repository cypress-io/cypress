// @see https://github.com/cypress-io/cypress/issues/22953
// We modify the user agent to strip cypress and electron out of the user agent string to appear more chrome-like
// this only happens in electron and when the experimentalModifyObstructiveThirdPartyCode flag is set to true
describe('user agent override', {
  browser: 'electron',
}, () => {
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
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="cross-origin-secondary-link"]').click()

    cy.origin('http://www.foobar.com:3500', {
      args: {
        userAgentBefore: window.navigator.userAgent,
      },
    }, ({ userAgentBefore }) => {
      cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

      cy.go('back')
      cy.wrap(window.navigator.userAgent).then((userAgentAfter) => {
        expect(userAgentBefore).to.equal(userAgentAfter)
      })

      cy.go('forward')
      cy.wrap(window.navigator.userAgent).then((userAgentAfter) => {
        expect(userAgentBefore).to.equal(userAgentAfter)
      })
    })
  })
})
