describe('src/cy/commands/prompt', () => {
  it('errors if download timeout is reached', (done) => {
    cy.on('fail', (err) => {
      expect(err.message).to.include('Timed out downloading `cy.prompt` Cloud code')
      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt(10000)
    // @ts-expect-error - _downloadTimeout is a private option
    cy.prompt(['Click the "click me" button'], { _downloadTimeout: 10 })
  })

  it('errors if wait for ready does not return success and error is ENOSPC', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    const error = new Error(`no space left on device, open /Users/ruby/dev/bundle.tar`)

    ;(error as any).code = 'ENOSPC'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('Failed to download `cy.prompt` Cloud code')
      expect(err.message).to.include(`no space left on device, open /Users/ruby/dev/bundle.tar`)

      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt()
    cy.prompt(['Hello, world!'])
  })

  it('errors with a proxy error', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    const error = new Error('UNABLE_TO_VERIFY_LEAF_SIGNATURE')

    ;(error as any).code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.prompt` requires an internet connection to work. To continue, you may need to configure Cypress with your proxy settings.')
      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt()
    cy.prompt(['Hello, world!'])
  })
})
