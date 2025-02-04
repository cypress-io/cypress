/* eslint-disable no-undef */
describe('page_loading', () => {
  it('sets __cypress.initial, properly injects, and avoids json injection', () => {
    // this tests that __cypress.initial is set correctly whilst navigating
    // between pages, or during cy.reload
    // additionally this creates an edge case where after __cypress.initial is
    // set we send an XHR which should not inject because its requested for JSON
    // but that another XHR which is requested for html should inject
    const promise1 = Cypress.Promise.pending()
    const promise2 = Cypress.Promise.pending()

    cy.visit('http://localhost:1717/first')
    cy.get('h1').should('contain', 'first')
    cy.get('a').click()
    cy.url().should('match', /second/)
    cy.get('h1').should('contain', 'second')
    cy.get('#count').should('contain', 1)
    cy.reload(true) // force hard reload to increment count
    cy.get('#count').should('contain', 2)
    cy.window().then((win) => {
      const a = Cypress.$('a')

      // we are delaying here because normally when cypress
      // detects page:loading event it will cancel all outstanding
      // XHR requests.
      // so by delaying we force those to go out correctly
      a.click(() => {
        return Cypress.Promise
        .delay(500)
        .then(() => {
          const xhr1 = new win.XMLHttpRequest

          xhr1.open('POST', '/json')
          xhr1.setRequestHeader('Content-Type', 'application/json')
          xhr1.onload = () => {
            return promise1.resolve(JSON.parse(xhr1.response))
          }

          xhr1.send(JSON.stringify({ foo: 'bar' }))

          const xhr2 = new win.XMLHttpRequest

          xhr2.open('GET', '/html')
          xhr2.onload = () => {
            return promise2.resolve(xhr2.response)
          }

          return xhr2.send()
        })
      })
    })

    cy.get('a').click()
    .then(() => {
      return Cypress.Promise.all([promise1.promise, promise2.promise])
    }).spread((resp1, resp2) => {
      expect(resp1).to.deep.eq({ body: { foo: 'bar' } })
      expect(resp2).to.include('content')
    })
  })

  describe('issue #258: opener is undefined during snapshot', () => {
    it('causes the xhr to be aborted while in flight', () => {
      cy.visit('http://localhost:1717/form')
      cy.get('form').submit()
    })
  })
})
