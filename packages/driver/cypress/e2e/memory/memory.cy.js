describe('memory spec', { browser: { family: 'chromium' } }, () => {
  const text = 'x'.repeat(100000)

  beforeEach(() => {
    if (!Cypress.config('isActuallyInteractive')) {
      Cypress.config('isInteractive', false)
      Cypress.config('numTestsKeptInMemory', 0)
    }
  })

  for (let index = 0; index < 50; index++) {
    it(`test ${index + 1} passes`, () => {
      cy.visit('http://localhost:3500/memory')

      for (let index = 0; index < 100; index++) {
        cy.get(`#p${index}`).should('have.text', text)
      }
    })
  }
})
