it('runs folder-b/spec-a', () => {
  expect(true).eq(true)

  expect(Cypress.spec.relative.replace(/\\/g, '/')).eq('cypress/e2e/folder-b/spec-a.cy.ts')
  expect(Cypress.spec.absolute.replace(/\\/g, '/')).match(/cypress\/e2e\/folder-b\/spec-a\.cy\.ts$/)
  expect(Cypress.spec.name).eq('spec-a.cy.ts')
  expect(Cypress.spec.fileName).eq('spec-a')
})
