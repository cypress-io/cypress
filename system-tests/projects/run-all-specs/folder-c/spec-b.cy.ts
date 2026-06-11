it('runs folder-c/spec-b', () => {
  expect(true).eq(true)

  // Cypress.spec must identify this file even when running via "Run All Specs" (#3090)
  expect(Cypress.spec.relative.replace(/\\/g, '/')).eq('folder-c/spec-b.cy.ts')
  expect(Cypress.spec.absolute.replace(/\\/g, '/')).match(/folder-c\/spec-b\.cy\.ts$/)
  expect(Cypress.spec.name).eq('spec-b.cy.ts')
  expect(Cypress.spec.fileName).eq('spec-b')
})
