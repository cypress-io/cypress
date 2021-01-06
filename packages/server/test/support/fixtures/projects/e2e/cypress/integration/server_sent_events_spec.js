/* eslint-disable
    no-undef,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const urlErrors = (win, url) => {
  return new Promise((resolve, reject) => {
    const es = new win.EventSource(url)

    es.onerror = function (err) {
      es.close()

      return resolve()
    }

    es.onopen = (evt) => {
      return reject(`event source connection should not have opened for url: ${url}`)
    }
  })
}

describe('server sent events', () => {
  beforeEach(() => {
    return cy.visit('http://localhost:3038/foo')
  })

  it('does not crash', () => {
    cy.window().then({ timeout: 15000 }, (win) => {
      return Cypress.Promise.all([
        urlErrors(win, 'http://localhost:3038/sse'),
        urlErrors(win, 'https://localhost:3040/sse'),
      ])
    })

    return cy
    .log('should be able to receive server sent events')
    .window()
    .then((win) => {
      return new Promise((resolve, reject) => {
        const received = []

        const es = new win.EventSource('http://127.0.0.1:3039/sse')

        es.onmessage = function (evt) {
          received.push(evt.data)

          if (evt.data === '5') {
            es.close()

            return resolve(received)
          }
        }

        es.onerror = reject
      })
    }).should('deep.eq', ['1', '2', '3', '4', '5'])
  })

  it('aborts proxied connections to prevent client connection buildup', () => {
    // there shouldn't be any leftover connections either
    cy
    .request('http://localhost:3038/clients')
    .its('body').should('deep.eq', { clients: 0 })

    return cy
    .window()
    .then((win) => {
      return new Promise((resolve, reject) => {
        const es = new win.EventSource('http://127.0.0.1:3039/sse')

        es.onopen = (evt) => {
          return resolve(es)
        }

        es.onerror = reject
      })
    }).then((es) => {
      return cy
      .request('http://localhost:3038/clients')
      .its('body').should('deep.eq', { clients: 1 })
      .then(() => {
        return es.close()
      }).wait(100)
      .then(() => {
        return cy
        .request('http://localhost:3038/clients')
        .its('body').should('deep.eq', { clients: 0 })
      })
    })
  })
})
