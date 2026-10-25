describe('query timeout error wording', { retries: 0 }, () => {
  it('omits retry wording for a zero default timeout', { defaultCommandTimeout: 0 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value').should('equal', 2)
  })

  it('omits retry wording for an explicit zero timeout', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value', { timeout: 0 }).should('equal', 2)
  })

  it('keeps retry wording for a positive timeout', { defaultCommandTimeout: 4000 }, (done) => {
    cy.once('fail', (err) => {
      expect(err.message).to.eq('Timed out retrying after 100ms: expected 1 to equal 2')
      done()

      return false
    })

    cy.wrap({ value: 1 }).its('value', { timeout: 100 }).should('equal', 2)
  })
})
