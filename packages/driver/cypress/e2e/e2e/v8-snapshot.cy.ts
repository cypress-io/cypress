describe('v8 snapshot', () => {
  it('has access to the snapshot in the server but not in the browser', () => {
    cy.visit('/fixtures/empty.html')
  })
})
