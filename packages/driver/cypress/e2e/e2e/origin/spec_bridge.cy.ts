it('visits foobar.com and types foobar inside an input', { browser: '!webkit' }, () => {
  cy.visit('/fixtures/primary-origin.html')
  cy.get('[data-cy="cross-origin-secondary-link"]').click()

  cy.origin('http://www.foobar.com:3500', () => {
    cy.get('[data-cy="text-input"]').type('foobar')
  })
  .then(() => {
    const specBridgeIframe: HTMLIFrameElement = window?.top?.document.querySelector('.spec-bridge-iframe') || {} as HTMLIFrameElement
    const currentBody = window?.top?.document.querySelector('body') || {} as HTMLBodyElement

    // make sure the spec bridge overlays the reporter/AUT and is not off the screen
    expect(specBridgeIframe.offsetTop).to.equal(currentBody.offsetTop)
    expect(specBridgeIframe.offsetLeft).to.equal(currentBody.offsetLeft)
    expect(specBridgeIframe.clientWidth).to.equal(currentBody.clientWidth)
    expect(specBridgeIframe.clientHeight).to.equal(currentBody.clientHeight)
  })
})

it('keeps the verification error when cy.origin() is not verified', { browser: '!webkit', defaultCommandTimeout: 200 }, function (done) {
  this.timeout(2000)

  const notVerified = Object.assign(new Error('not verified'), { isNonSpec: true })
  let originLog

  cy.stub(Cypress, 'backend').callThrough().withArgs('run:privileged').rejects(notVerified)

  cy.on('log:added', (attrs, log) => {
    if (attrs.name === 'origin') originLog = log
  })

  cy.on('fail', (err) => {
    expect(err.message).to.include('must only be invoked from the spec file or support file')

    // wait past defaultCommandTimeout, when the spec bridge timeout would fire
    setTimeout(() => {
      try {
        expect(originLog.get('error')).to.equal(err)
        done()
      } catch (e) {
        done(e)
      }
    }, 400)
  })

  cy.origin('http://www.foobar.com:3500', () => {})
})
