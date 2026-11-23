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

  it('errors with a network error that names the code and points to the network', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    // node-fetch's message for a DNS lookup failure
    const error = new Error('request to https://api.cypress.io/cy-prompt/session failed, reason: getaddrinfo ENOTFOUND api.cypress.io')

    ;(error as any).code = 'ENOTFOUND'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.prompt` could not connect to Cypress Cloud')
      expect(err.message).to.include('ENOTFOUND: request to https://api.cypress.io/cy-prompt/session failed, reason: getaddrinfo ENOTFOUND api.cypress.io')
      expect(err.message).to.include('Check your internet connection and that your network allows Cypress Cloud.')
      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt()
    cy.prompt(['Hello, world!'])
  })

  // https://github.com/cypress-io/cypress/issues/33105
  it('errors with a certificate error that names the code and points to trusting a custom CA', (done) => {
    const backendStub = cy.stub(Cypress, 'backend').log(false)

    // Node's message for this code, as raised by its TLS socket
    const error = new Error('unable to verify the first certificate')

    ;(error as any).code = 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'

    backendStub.callThrough()
    backendStub.withArgs('wait:for:prompt:ready').resolves({ success: false, error })

    cy.on('fail', (err) => {
      expect(err.message).to.include('`cy.prompt` could not verify the certificate for its connection to Cypress Cloud')
      expect(err.message).to.include('UNABLE_TO_VERIFY_LEAF_SIGNATURE: unable to verify the first certificate')
      expect(err.message).to.include('trust your organization\'s certificate authority with `NODE_EXTRA_CA_CERTS`')
      expect(err.message).to.include('If you connect through a proxy, configure Cypress with your proxy settings.')
      done()
    })

    cy.visit('http://www.foobar.com:3500/fixtures/dom.html')

    cy['commandFns']['prompt'].__resetPrompt()
    cy.prompt(['Hello, world!'])
  })
})
