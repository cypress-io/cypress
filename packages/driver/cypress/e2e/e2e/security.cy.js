describe('security', () => {
  it('works by replacing obstructive code', () => {
    cy.visit('/fixtures/security.html')
    cy.get('div').should('not.exist')
  })

  it('works even with content-security-policy script-src', () => {
    // create report URL
    cy.intercept('/csp-report', (req) => {
      throw new Error(`/csp-report should not be reached:${ req.body}`)
    })

    // inject script-src on visit
    cy.intercept('/fixtures/empty.html', (req) => {
      req.continue((res) => {
        res.headers['content-security-policy'] = `script-src http://not-here.net; report-uri /csp-report`
      })
    })

    cy.visit('/fixtures/empty.html')
    .wait(1000)
  })
})
