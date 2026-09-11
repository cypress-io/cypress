// https://github.com/cypress-io/cypress/issues/8998
// This regression verifies that scroll-clipped elements inside a position:fixed
// ancestor are reported as not visible — a behavior provided only by the legacy
// ancestor-walking algorithm. The modern algorithm delegates to
// Element.checkVisibility() which intentionally doesn't detect scroll clipping.
it('issue 8998', { visibilityStrategy: 'legacy' }, () => {
  cy.visit('fixtures/issue-8998.html')
  cy.get('.option').then((el) => {
    const x = Cypress.dom.isVisible(el[8])

    expect(x).to.be.false
  })
})
