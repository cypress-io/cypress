describe('native promise completion controls', { defaultCommandTimeout: 1000 }, () => {
  const pause = () => new Promise((resolve) => setTimeout(resolve, 30))

  it('supports a native promise without Cypress commands', async () => {
    await pause()
    expect(1).to.equal(1)
  })

  it('waits for commands after native await', async () => {
    await pause()
    cy.wrap(1).should('equal', 1)
  })

  it('supports multiple successful command batches', async () => {
    cy.wrap(1).should('equal', 1)
    await pause()
    cy.wrap(2).should('equal', 2)
    await pause()
    cy.wrap(3).should('equal', 3)
  })

  it('supports the existing then-and-catch promise-like shape', () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => {
        cy.wrap(1).should('equal', 1)
        resolve()
      }, 20)
    })

    return { then: promise.then.bind(promise), catch: promise.catch.bind(promise) }
  })

  context('async hook', () => {
    let completed = false

    beforeEach(async () => {
      await pause()
      cy.wrap(1).should('equal', 1).then(() => {
        completed = true
      })
    })

    it('finishes the hook queue before the test begins', () => {
      expect(completed).to.equal(true)
    })
  })
})
