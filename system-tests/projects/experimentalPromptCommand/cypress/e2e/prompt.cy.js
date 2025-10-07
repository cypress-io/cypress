describe('prompt', () => {
  it('should fail when experimentalPromptCommand is not set', () => {
    cy.prompt(['Click the "click me" button'])
  })
})
