describe('fails prior to top change', () => {
  let firstAttempt = true

  it('fails prior to top change', () => {
    const oldFirstAttempt = firstAttempt

    firstAttempt = false

    expect(oldFirstAttempt).to.be.false

    cy.visit('http://localhost:5353/index.html')
  })
})
