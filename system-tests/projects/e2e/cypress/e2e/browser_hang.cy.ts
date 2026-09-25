describe('a test suite with a browser hang', () => {
  it('passes before the hang', () => {
    cy.visit('/index.html')
  })

  it('blocks the main thread', () => {
    cy.visit('/index.html')

    cy.then(() => {
      // bounded so that if hang detection never fires, this test passes
      // and the system test fails on the exit code instead of timing out
      const end = Date.now() + 60000

      while (Date.now() < end) {
        // busy-wait to block the renderer's main thread
      }
    })
  })

  it('never runs because the spec ended early', () => {
    cy.visit('/index.html')
  })
})
