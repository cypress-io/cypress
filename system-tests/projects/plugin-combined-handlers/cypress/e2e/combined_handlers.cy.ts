describe('combined after:screenshot handlers', () => {
  it('reports the screenshot details returned by the last handler', () => {
    let reportedPath: string | undefined

    cy.screenshot('combined', {
      capture: 'runner',
      onAfterScreenshot ($el, details) {
        reportedPath = details.path
      },
    })
    .then(() => {
      expect(reportedPath).to.include('screenshot-replacement.png')
    })
  })
})
