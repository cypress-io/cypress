describe('folder-a/spec-a', () => {
  before(() => {
    cy.task('getBeforeSpecRecord').then((record: Record<string, boolean>) => {
      const key = Cypress.spec.absolute.replace(/\\/g, '/')

      expect(record[key], `before:spec should have fired for ${key} before this suite's before() hook`).to.be.true
    })
  })

  it('runs folder-a/spec-a', () => {
    expect(true).eq(true)

    expect(Cypress.spec.relative.replace(/\\/g, '/')).eq('cypress/e2e/folder-a/spec-a.cy.ts')
    expect(Cypress.spec.absolute.replace(/\\/g, '/')).match(/cypress\/e2e\/folder-a\/spec-a\.cy\.ts$/)
    expect(Cypress.spec.name).eq('spec-a.cy.ts')
    expect(Cypress.spec.fileName).eq('spec-a')
  })
})
