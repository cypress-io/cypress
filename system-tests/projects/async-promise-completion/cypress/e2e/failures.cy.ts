describe('native promises and queued assertion failures', () => {
  it('attributes a failure queued after native await', async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
    cy.wrap(1).should((value) => {
      expect(value, 'ASYNC_AFTER_AWAIT_ASSERTION').to.equal(2)
    })
  })

  it('attributes failure in a later command batch', async () => {
    cy.wrap(1).should('equal', 1)
    await new Promise((resolve) => setTimeout(resolve, 50))
    cy.wrap(2).should((value) => {
      expect(value, 'ASYNC_LATER_BATCH_ASSERTION').to.equal(3)
    })
  })

  it('fails promptly when the native promise remains pending', async () => {
    cy.wrap(1).should((value) => {
      expect(value, 'ASYNC_EARLY_QUEUE_ASSERTION').to.equal(2)
    })

    await new Promise(() => {})
  })

  it('observes a later batch failure while native work remains pending', async () => {
    cy.wrap(1).should('equal', 1)
    await new Promise((resolve) => setTimeout(resolve, 30))
    cy.wrap(2).should((value) => {
      expect(value, 'ASYNC_PENDING_NATIVE_ASSERTION').to.equal(3)
    })

    await new Promise(() => {})
  })
})
