describe('src/cy/commands/prompt', () => {
  it('errors if wait for ready does not return success', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    backendStub.callThrough()
    backendStub.withArgs('wait:for:cy:prompt:ready').resolves({ success: false })

    cy.on('fail', (err) => {
      expect(err.message).to.include('error waiting for cy prompt bundle to be downloaded and ready')

      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__reset()
    // @ts-expect-error - this will not error when we actually release the experimentalPromptCommand flag
    cy.prompt('Hello, world!')
  })
})
