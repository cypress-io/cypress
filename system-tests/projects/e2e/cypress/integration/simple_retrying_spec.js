describe('simple retrying spec', () => {
  it('t1', () => {
    const test = cy.state('test')

    throw new Error(`${test.title} attempt #${cy.state('test').currentRetry()}`)
  })

  it('t2', () => {
    // pass
  })
})
