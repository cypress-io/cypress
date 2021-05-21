// NOTE: this test only exists for manual verification as the
// multidomain bundle is a very incomplete work-in-progress
it('loads multidomain playground', () => {
  cy.visit('/fixtures/multidomain.html')
})
