describe('memory spec', () => {
  for (let index = 0; index < 200; index++) {
    it(`passes test ${index + 1}`, () => {
      cy.visit('http://localhost:3500/memory')

      for (let i = 0; i < 100; i++) {
        cy.get(`#p${i}`).should('have.text', 'x'.repeat(10000))
      }
    })
  }
})
