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
