describe('simple pending spec', () => {
  // eslint-disable-next-line
  it.skip('is pending', () => {
    cy.wrap(true).should('be.true')
  })
})
