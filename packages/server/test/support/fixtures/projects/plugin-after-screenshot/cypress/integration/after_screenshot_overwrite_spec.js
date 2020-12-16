Cypress._.times(3, () => {
  it('cy.screenshot() - replacement', () => {
    cy.screenshot('replace-me', { capture: 'runner' }, {
      onAfterScreenshot (details) {
        expect(details.path).to.include('screenshot-replacement.png')
        expect(details.size).to.equal(1047)

        expect(details.dimensions).to.eql({ width: 1, height: 1 })
      },
    })
  })
})
