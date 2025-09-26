describe('src/cy/commands/prompt', () => {
  it('errors if download timeout is reached', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Timed out waiting for cy.prompt Cloud code')
      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt(10000)
    // @ts-expect-error - _downloadTimeout is a private option
    cy.prompt(['Click the "click me" button'], { _downloadTimeout: 10 })
  })

  it('errors if wait for ready does not return success and error is ENOSPC', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    const error = new Error(`no space left on device, open '<stripped-path>bundle.tar`)

    ;(error as any).code = 'ENOSPC'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('Failed to download cy.prompt Cloud code')
      expect(err.message).to.include(`no space left on device, open '<stripped-path>bundle.tar`)

      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt()
    cy.prompt(['Hello, world!'])
  })
})
