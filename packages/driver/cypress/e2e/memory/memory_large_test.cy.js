describe('memory spec', { browser: { family: 'chromium' } }, () => {
  it('passes when loading page a 100 times', () => {
    for (let index = 0; index < 100; index++) {
      cy.visit('http://localhost:3500/memory')
    }
  })
})
