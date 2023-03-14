describe('async test functions', () => {
  it('fails an async test properly', { defaultCommandTimeout: 50 }, async () => {
    cy.on('fail', (err) => {
      expect(err.message).to.eql('Timed out retrying after 50ms: expected true to be false')
    })

    await 1
    cy.wrap(true).should('be.false')
  })

  it('passes', { defaultCommandTimeout: 50 }, async () => {
    const sub = await cy.wrap(true).should('be.true')

    const external = await Promise.resolve('external')

    const body = await cy.get('body')

    expect(sub).to.be.true
    expect(external).to.eq('external')
    expect(body).to.eql(cy.$$('body'))
  })

  it('works with done callback for test', (done) => {
    cy.on('command:queue:end', () => {
      done()
    })
    cy.wait(50)
  })

  // This test does not past - it should time out and fail because done() is never called,
  // but it doesn't at the moment.
  it('foo', (done) => {
    cy.get('#dne', { timeout: 100 })
  })
})
