/* eslint-disable
    brace-style,
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
describe('page_loading', () => {
  it('sets __cypress.initial, properly injects, and avoids json injection', () => {
    // this tests that __cypress.initial is set correctly whilst navigating
    // between pages, or during cy.reload
    // additionally this creates an edge case where after __cypress.initial is
    // set we send an XHR which should not inject because its requested for JSON
    // but that another XHR which is requested for html should inject
    const promise1 = Cypress.Promise.pending()
    const promise2 = Cypress.Promise.pending()

    return cy
    .visit('http://localhost:1717/first')
    .get('h1').should('contain', 'first')
    .get('a').click()
    .url().should('match', /second/)
    .get('h1').should('contain', 'second')
    .get('#count').should('contain', 1)
    .reload(true) // force hard reload to increment count
    .get('#count').should('contain', 2)
    .window().then((win) => {
      const a = Cypress.$('a')

      return a.click(() => // we are delaying here because normally when cypress
      // detects page:loading event it will cancel all outstanding
      // XHR requests.
      // so by delaying we force those to go out correctly
      {
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
    }).get('a').click()
    .then(() => {
      return Cypress.Promise.all([promise1.promise, promise2.promise])
    }).spread((resp1, resp2) => {
      expect(resp1).to.deep.eq({ body: { foo: 'bar' } })

      expect(resp2).to.include('document.domain = \'localhost\'')

      expect(resp2).to.include('content')
    })
  })

  describe('issue #258: opener is undefined during snapshot', () => {
    it('causes the xhr to be aborted while in flight', () => {
      return cy
      .visit('http://localhost:1717/form')
      .get('form').submit()
    })
  })
})
