describe('src/cy/commands/actions/hover', () => {
  beforeEach(() => {
    cy.visit('/fixtures/dom.html')
  })

  context('#hover', () => {
    it('throws when invoking', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('`cy.hover()` is not currently implemented.')
        expect(err.docsUrl).to.eq('https://on.cypress.io/hover')

        done()
      })

      cy.get('button').hover()
    })
  })
})
