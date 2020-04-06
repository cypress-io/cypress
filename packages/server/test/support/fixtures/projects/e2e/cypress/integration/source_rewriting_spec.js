describe('source rewriting spec', function () {
  context('can load some well-known sites without failing', () => {
    [
      'http://apple.com',
      'http://google.com',
      'http://facebook.com',
      'http://cypress.io',
      'http://docs.cypress.io',
      'http://github.com',
    ].forEach((url) => {
      it(url, () => {
        cy.visit(url)
      })
    })
  })
})
