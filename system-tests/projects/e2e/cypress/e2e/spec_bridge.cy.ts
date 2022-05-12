it('visits foobar.com and types foobar inside an input', () => {
  cy.visit('primary_origin.html')
  cy.get('[data-cy="cross_origin_secondary_link"]').click()

  cy.origin('http://foobar.com:4466', () => {
    cy.get('[data-cy="text-input"]').type('foobar')
  })
  .then(() => {
    const specBridgeIframe: HTMLIFrameElement = window.top.document.querySelector('.spec-bridge-iframe')
    const currentBody = window.top.document.querySelector('body')

    // make sure the spec bridge overlays the reporter/AUT and is not off the screen
    expect(specBridgeIframe.offsetTop).to.equal(currentBody.offsetTop)
    expect(specBridgeIframe.offsetLeft).to.equal(currentBody.offsetLeft)
    expect(specBridgeIframe.clientWidth).to.equal(currentBody.clientWidth)
    expect(specBridgeIframe.clientHeight).to.equal(currentBody.clientHeight)
  })
})
