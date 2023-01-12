describe('page', () => {
  for (let index = 0; index < 1; index++) {
    it(`test ${index + 1}`, { retries: 0 }, () => {
      cy.visit('https://earth.google.com/web/')
    })
  }
})
