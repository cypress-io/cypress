it('runs folder-a/spec-a', () => {
  expect(true).eq(true)

  // Cypress.spec must identify this file even when running via "Run All Specs" (#3090)
  expect(Cypress.spec.relative.replace(/\\/g, '/')).eq('cypress/e2e/folder-a/spec-a.cy.ts')
  expect(Cypress.spec.absolute.replace(/\\/g, '/')).match(/cypress\/e2e\/folder-a\/spec-a\.cy\.ts$/)
  expect(Cypress.spec.name).eq('spec-a.cy.ts')
  expect(Cypress.spec.fileName).eq('spec-a')
})
