describe('memory spec', { browser: { family: 'chromium' } }, () => {
  for (let index = 0; index < 50; index++) {
    it(`test ${index + 1} passes`, () => {
      cy.visit('http://localhost:3500/memory')
    })
  }
})
