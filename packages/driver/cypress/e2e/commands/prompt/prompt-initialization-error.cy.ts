describe('src/cy/commands/prompt', () => {
  it('errors if wait for ready does not return success and error is ENOSPC', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    const error = new Error(`no space left on device, open '<stripped-path>bundle.tar`)

    error.name = 'ENOSPC'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('Failed to download cy.prompt Cloud code')
      expect(err.message).to.include(`no space left on device, open '<stripped-path>bundle.tar`)

      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__reset()
    // @ts-expect-error - this will not error when we actually release the experimentalPromptCommand flag
    cy.prompt('Hello, world!')
  })

  it('errors if wait for ready does not return success and error is ECONNREFUSED', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    const error = new Error(`'<stripped-path>bundle.tar' timed out after 10000s`)

    error.name = 'ECONNREFUSED'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('Timed out waiting for cy.prompt Cloud code:')
      expect(err.message).to.include(`'<stripped-path>bundle.tar' timed out after 10000s`)

      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__reset()
    // @ts-expect-error - this will not error when we actually release the experimentalPromptCommand flag
    cy.prompt('Hello, world!')
  })
})
