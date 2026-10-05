describe('a spec that stops making progress', () => {
  it('waits on a command that never finishes', () => {
    // a timeout this long turns off both the command's own timeout and the test timeout
    cy.wrap(new Promise(() => {}), { timeout: 2 ** 31 - 1 })
  })
})
