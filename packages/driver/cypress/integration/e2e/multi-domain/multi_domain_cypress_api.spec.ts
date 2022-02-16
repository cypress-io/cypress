// @ts-ignore / session support is needed for visiting about:blank between tests+
describe('multi-domain Cypress API', { experimentalSessionSupport: true, experimentalMultiDomain: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/multi-domain.html')
    cy.get('a[data-cy="multi-domain-secondary-link"]').click()
  })

  context('not supported', () => {
    it('throws an error when a user attempts to configure Cypress.Server.defaults() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Server.*` has been deprecated and use is forbidden in `cy.switchToDomain()`. Consider migrating to using `cy.intercept()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.Server.defaults({})
      })
    })

    it('throws an error when a user attempts to configure Cypress.Cookies.defaults() inside of multi-domain', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.equal('`Cypress.Cookies.*` use is forbidden in `cy.switchToDomain()`. Consider using `cy.session()` instead.')
        done()
      })

      cy.switchToDomain('foobar.com', () => {
        Cypress.Cookies.defaults({})
      })
    })
  })
})
