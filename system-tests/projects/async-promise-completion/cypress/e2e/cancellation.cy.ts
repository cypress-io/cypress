describe('stop during native promise work', { defaultCommandTimeout: 1000 }, () => {
  const driver = cy as typeof cy & { stop: () => void }

  it('settles cancellation of the initial command queue', async () => {
    cy.then(() => driver.stop())
    await new Promise(() => {})
  })

  it('settles cancellation of a later command queue', async () => {
    cy.wrap(1).should('equal', 1)
    await new Promise((resolve) => setTimeout(resolve, 30))
    cy.then(() => driver.stop())
    await new Promise(() => {})
  })
})
