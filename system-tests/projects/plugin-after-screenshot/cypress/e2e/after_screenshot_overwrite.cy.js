Cypress._.times(3, () => {
  it('cy.screenshot() - replacement', () => {
    let details

    cy.screenshot('replace-me', {
      capture: 'runner',
      onAfterScreenshot ($el, afterScreenshotDetails) {
        details = afterScreenshotDetails
      },
    })
    .then(() => {
      expect(details.path).to.include('screenshot-replacement.png')
      expect(details.size).to.equal(2222)

      expect(details.dimensions).to.eql({ width: 2, height: 2 })
    })
  })
})
