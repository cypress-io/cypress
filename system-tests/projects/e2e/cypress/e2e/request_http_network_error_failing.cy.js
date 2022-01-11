describe('when network connection cannot be established', () => {
  it('fails', () => {
    cy.request('http://localhost:16795')
  })
})
