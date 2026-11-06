it('runs commands enqueued during the terminal stability wait', { defaultCommandTimeout: 1000 }, async () => {
  const driver = cy as typeof cy & { isStable: (stable: boolean, event: string) => void }
  const events = Cypress as typeof Cypress & { once: (name: string, fn: () => void) => void }
  const ending = new Promise<void>((resolve) => {
    events.once('command:queue:before:end', () => {
      driver.isStable(false, 'async terminal stability regression')
      setTimeout(resolve, 20)
    })
  })

  cy.wrap(1)
  await ending
  cy.then(() => {
    expect(false, 'ASYNC_STABILITY_WINDOW_ASSERTION').to.equal(true)
  })

  driver.isStable(true, 'async terminal stability regression complete')
})
