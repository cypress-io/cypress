describe(`experimentalCspAllowList=['script-src-elem', 'script-src', 'default-src']`, () => {
  let visitUrl: URL
  const timeout = 1000

  beforeEach(() => {
    visitUrl = new URL('http://localhost:4466/csp_script_test.html')
  })

  it('fails on inline form action', {
    pageLoadTimeout: timeout,
    // @ts-expect-error
  }, () => {
    visitUrl.searchParams.append('csp', `form-action 'none'`)

    cy.visit(visitUrl.toString())

    cy.get('#submit').click()
  })
})
