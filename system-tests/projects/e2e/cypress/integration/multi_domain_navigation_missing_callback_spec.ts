// @ts-ignore / session support is needed for visiting about:blank between tests
describe('multi-domain - navigation missing callback', { experimentalSessionSupport: true }, () => {
  it('passes since switchToDomain callback exists', () => {
    cy.visit('/multi_domain.html')
    cy.get('a[data-cy="multi_domain_secondary_link"]').click()

    cy.switchToDomain('foobar.com', () => undefined)
  })

  it('fails since switchToDomain callback is not registered for new cross origin domain', () => {
    cy.visit('/multi_domain.html')
    cy.get('a[data-cy="multi_domain_secondary_link"]').click()
    // give the test time for switchToDomain to timeout (currently is a 2 second timeout). Otherwise, request is cancelled
    cy.wait(3000)
  })

  it('passes since switchToDomain callback exists', () => {
    cy.visit('/multi_domain.html')
    cy.get('a[data-cy="multi_domain_secondary_link"]').click()

    cy.switchToDomain('foobar.com', () => undefined)
  })
})
