describe('page', () => {
  for (let index = 0; index < 200; index++) {
    it(`test ${index + 1}`, () => {
      cy.visit('https://earth.google.com/web/')
    })
  }
})
