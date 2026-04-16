describe('suite', function () {
  it('is true', () => {
    expect(true).to.be.true
    cy.wait(150)
  })

  it('is still true', () => {
    // the config should crash before this test completes;
    // this is a long wait in order to improve predictability
    expect(true).to.be.true
    cy.task('log', 'This will be output to the terminal')
  })
})
