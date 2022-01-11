describe('assertion errors', () => {
  it('fails with assertion diff, no retries', () => {
    expect([]).to.eql([1, 2, 3])
  })

  it('fails with assertion diff, with retries', () => {
    cy.wrap([]).should('eql', [1, 2, 3])
  })

  it('fails with dom assertion without diff, with retries', () => {
    cy.get('body').then(($el) => {
      expect($el).to.have.class('foo')
    })
  })

  it('fails with dom assertion without diff, with retries', () => {
    cy.get('body').should('have.class', 'foo')
  })
})
