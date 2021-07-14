// FIXME: Skip these for now since they're flaky
describe.skip('multidomain', () => {
  const expectTextMessage = (text, done) => {
    const onMessage = (event) => {
      if (event.data && event.data.queriedText !== undefined) {
        expect(event.data.host).to.equal('127.0.0.1:3501')
        expect(event.data.queriedText).to.equal(text)

        top.removeEventListener('message', onMessage)

        done()
      }
    }

    top.addEventListener('message', onMessage, false)
  }

  beforeEach(() => {
    cy.visit('/fixtures/multidomain.html')
    // @ts-ignore
    cy.anticipateMultidomain()
    cy.get('a').click()
  })

  it('runs synchronous commands in secondary domain', (done) => {
    expectTextMessage('From a secondary domain', done)

    // @ts-ignore
    cy.switchToDomain('127.0.0.1:3501', () => {
      // @ts-ignore
      cy.now('get', '[data-cy="dom-check"]').then(($el) => {
        top.postMessage({ host: location.host, queriedText: $el.text() }, '*')
      })
    })
  })

  it('sets up window.Cypress in secondary domain', (done) => {
    expectTextMessage('Has window.Cypress', done)

    // @ts-ignore
    cy.switchToDomain('127.0.0.1:3501', () => {
      // @ts-ignore
      cy.now('get', '[data-cy="cypress-check"]').then(($el) => {
        top.postMessage({ host: location.host, queriedText: $el.text() }, '*')
      })
    })
  })
})
