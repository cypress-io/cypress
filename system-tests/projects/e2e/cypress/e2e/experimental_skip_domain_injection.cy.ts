describe('expected behavior when experimentalSkipDomainInjection=true', () => {
  it('Handles cross-site/cross-origin navigation the same way without the experimental flag enabled', () => {
    cy.visit('/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
    cy.origin('http://www.foobar.com:4466', () => {
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })
  })

  it('errors appropriately when doing a sub domain navigation w/o cy.origin()', () => {
    const timeout = 500

    cy.on('fail', (err) => {
      expect(err.name).to.equal('CypressError')
      expect(err.message).to.contain(`Timed out retrying after ${timeout}ms: The command was expected to run against origin \`http://app.foobar.com:4466\` but the application is at origin \`http://www.foobar.com:4466\`.`)
      expect(err.message).to.contain('This commonly happens when you have either not navigated to the expected origin or have navigated away unexpectedly.')
      expect(err.message).to.contain('Using `cy.origin()` to wrap the commands run on `http://www.foobar.com:4466` will likely fix this issue.')
      expect(err.message).to.include(`cy.origin('http://www.foobar.com:4466', () => {\`\n\`  <commands targeting http://www.foobar.com:4466 go here>\`\n\`})`)
      expect(err.message).to.include('If `experimentalSkipDomainInjection` is enabled for this domain, a `cy.origin()` command is required.')

      //  make sure that the secondary origin failures do NOT show up as spec failures or AUT failures
      expect(err.message).not.to.include(`The following error originated from your test code, not from Cypress`)
      expect(err.message).not.to.include(`The following error originated from your application code, not from Cypress`)
    })

    // with experimentalSkipDomainInjection, sub domain navigations require a cy.origin() block
    cy.visit('http://app.foobar.com:4466/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()
    cy.get('[data-cy="dom-check"]', {
      timeout,
    }).should('have.text', 'From a secondary origin')
  })

  it('allows sub-domain navigations with the use of cy.origin()', () => {
    cy.visit('http://app.foobar.com:4466/primary_origin.html')
    cy.get('a[data-cy="cross_origin_secondary_link"]').click()

    // with experimentalSkipDomainInjection, sub domain navigations require a cy.origin() block
    cy.origin('http://www.foobar.com:4466', () => {
      cy.get('[data-cy="dom-check"]').should('have.text', 'From a secondary origin')
    })
  })
})
