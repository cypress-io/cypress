describe('issue #678', () => {
  it('visually checks if options work correctly', () => {
    cy.visit('/fixtures/issue-678.html')
    cy.contains('button').click({
      force: false,
    })
  })
})
