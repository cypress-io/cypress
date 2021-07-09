// FIXME: Skip this for now since it's flaky
it.skip('verifies initial implementation of sibling iframe and switchToDomain', (done) => {
  top.addEventListener('message', (event) => {
    if (event.data && event.data.textFromParagraph !== undefined) {
      expect(event.data.host).to.equal('127.0.0.1:3501')
      expect(event.data.textFromParagraph).to.equal('From a secondary domain with window.Cypress')
      done()
    }
  }, false)

  cy.viewport(900, 300)
  cy.visit('/fixtures/multidomain.html')
  // @ts-ignore
  cy.anticipateMultidomain()
  cy.get('a').click()
  // @ts-ignore
  cy.switchToDomain('127.0.0.1:3501', () => {
    // @ts-ignore
    cy.now('get', 'p').then(($el) => {
      top.postMessage({ host: location.host, textFromParagraph: $el.text() }, '*')
    })
  })
})
