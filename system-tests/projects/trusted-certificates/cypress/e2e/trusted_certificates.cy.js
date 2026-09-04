describe('trusted certificates', () => {
  // Visits a self-signed HTTPS origin whose leaf certificate is declared in the
  // project's `trustedCertificates`. On the browser (CDP) network path Cypress
  // no longer passes the blanket `--ignore-certificate-errors`, so the origin
  // only loads because its SPKI fingerprint is trusted — exercising the config
  // validation, SPKI computation, and `--ignore-certificate-errors-spki-list`
  // plumbing end to end. (The disk-cache effect of trusting the cert is not
  // asserted here; see the note in trusted_certificates_spec.ts.)
  it('loads a self-signed origin and its asset', () => {
    cy.visit('/')
    cy.get('h1').should('have.text', 'trusted')
    cy.window().should('have.prop', '__big', true)
  })
})
