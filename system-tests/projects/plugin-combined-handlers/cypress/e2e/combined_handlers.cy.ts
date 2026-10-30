it('reports the screenshot details returned by the combined after:screenshot handlers', () => {
  cy.screenshot('combined', { capture: 'runner' }, {
    onAfterScreenshot (details) {
      expect(details.path).to.include('screenshot-replacement.png')
    },
  })
})
