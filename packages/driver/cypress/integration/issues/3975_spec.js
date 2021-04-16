describe('issue 3975 redirect bug', () => {
  it('should visit the correct url', () => {
    cy.visit('/fixtures/nested/3975_a.html')
    cy.get('h1').should('contain', 'Loaded')
  })

  it('works with about:blank', () => {
    const win = cy.state('window')
    const x = new win.XMLHttpRequest()

    x.onload = function () {
      location.href = '3975_b.html'
    }

    x.open('GET', '/fixtures/nested/3975_a.html')
    x.send()
  })
})
