describe('src/cy/commands/network', () => {
  before(() => {
    cy.visit('/fixtures/network.html')
  })

  it('switches between offline and online', () => {
    cy.contains('We are currently online.')
    cy.network({ offline: true })
    cy.contains('We are currently offline.')
    cy.network({ offline: false })
    cy.contains('We are currently online.')
  })
})
