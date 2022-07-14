describe('src/cross-origin/patches', () => {
  beforeEach(() => {
    beforeEach(() => {
      cy.visit('/fixtures/primary-origin.html')
      cy.get('a[data-cy="cross-origin-secondary-link"]').click()
    })
  })

  context('#HTMLFormElement.submit', () => {
  })
})
