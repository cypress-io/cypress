describe('combined after:screenshot handlers', () => {
  it('reports the screenshot details returned by the last handler', () => {
    cy.screenshot('combined', { capture: 'runner' }, {
      onAfterScreenshot (details) {
        expect(details.path).to.include('screenshot-replacement.png')
      },
    })
  })
})
