describe('shadow dom actionability events used for protocol', () => {
  it('captures scroll events inside nested shadow dom and emits on the cypress:protocol:shadow-dom:element:scroll event', {
    protocolEnabled: true,
    browser: '!webkit',
  }, (done) => {
    cy.visit('/fixtures/shadow-dom-scroll.html')

    cy.window().then((win) => {
      win.document.addEventListener('cypress:protocol:shadow-dom:element:scroll', (event) => {
        expect(event.composed).to.be.true
        expect(event.bubbles).to.be.true
        expect(event.target.id).to.equal('scroll-box-container')
        done()
      })

      // test to make sure scroll event is bubbled up to the root document from the nested shadow DOM
      cy.get('#scroll-to-button', { includeShadowDom: true }).scrollIntoView()
    })
  })

  it('captures input events inside shadow dom and emits on the cypress:protocol:shadow-dom:element:input event', {
    protocolEnabled: true,
    browser: '!webkit',
  }, (done) => {
    cy.visit('/fixtures/shadow-dom-type.html')

    cy.window().then((win) => {
      win.document.addEventListener('cypress:protocol:shadow-dom:element:input', (event) => {
        expect(event.composed).to.be.true
        expect(event.bubbles).to.be.true

        // the event itself should come from our custom shadow DOM component, but the details of the event need to come from the nested
        // target input, #shadow-dom-input
        expect(event.target.id).to.equal('element')
        expect(event.detail.target.id).to.equal('shadow-dom-input')
        done()
      })

      // test to make sure input event from inside the shadow DOM is bubbled up correctly
      cy.get('#shadow-dom-input', { includeShadowDom: true }).type('f')
    })
  })
})
