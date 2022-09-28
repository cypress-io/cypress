describe('simple v8 snapshot spec', () => {
  it('passes', () => {
    cy.task('get:size:v8:snapshot').should('be.gt', 0)
    // TODO: This can be re-enabled once we pull in electron v21
    //expect(Object.keys(window.snapshotResult.customRequire.exports).length).to.equal(0)
  })
})
