describe('memory spec', () => {
  for (let index = 0; index < 100; index++) {
    it(`passes test ${index + 1}`, () => {
      cy.visit('http://localhost:3500/memory')
    })
  }
})
