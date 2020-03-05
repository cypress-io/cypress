describe('e2e browser crashing AUT spec', () => {
  it('freezes the AUT', () => {
    cy.visit('/browser_crasher.html')
  })
})
