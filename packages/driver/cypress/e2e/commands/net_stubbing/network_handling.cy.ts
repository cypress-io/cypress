import { uniqueRoute } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, state } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('events', function () {
    // @see https://github.com/cypress-io/cypress/issues/9170
    it('gracefully handles request received without a known route', function () {
      cy.intercept('/valid.json', (req) => {
        req.reply({ bad: 'should not be received' })
      })
      .then(() => {
        const routeIds = _.keys(state('routes'))

        // delete the driver-side route - the server-side route will still exist and cause an event
        // to be emitted to the driver
        delete state('routes')[routeIds[0]]
        expect(state('routes')).to.deep.eq({})

        return $.get('/fixtures/valid.json')
      })
      .then((body) => {
        expect(body).to.include({ foo: 1 })
      })
    })

    it('gracefully handles response received without a known route', function () {
      cy.intercept('/valid.json', (req) => {
        state('routes', {})

        req.reply((res) => {
          res.send({ bad: 'should not be received' })
        })
      })
      .then(() => {
        return $.get('/fixtures/valid.json')
      })
      .then((body) => {
        expect(body).to.include({ foo: 1 })
      })
    })

    it('gracefully handles response completed without a known route', function () {
      cy.intercept('/fixtures/valid.json*', (req) => {
        req.reply((res) => {
          state('routes', {})

          res.send({ bar: 2 })
        })
      })
      .then(() => {
        return $.get('/fixtures/valid.json')
      })
      .then((body) => {
        expect(body).to.include({ bar: 2 })
      })
    })
  })

  context('network handling', function () {
    // @see https://github.com/cypress-io/cypress/issues/8497
    it('can load transfer-encoding: chunked redirects', function () {
      cy.intercept('*')
      const originOne = 'http://foobar.com:3500'
      const originTwo = Cypress.config('injectDocumentDomain') ? 'http://localhost:3501' : 'http://foobar.com:3501'

      const url4 = `${originTwo}/fixtures/generic.html`
      const url3 = `${originTwo}/redirect?href=${encodeURIComponent(url4)}`
      const url2 = `${originOne}/redirect?chunked=1&href=${encodeURIComponent(url3)}`
      const url1 = `${originOne}/redirect?chunked=1&href=${encodeURIComponent(url2)}`

      cy.visit(`${originOne}/fixtures/empty.html`)

      cy.visit(url1).as('redirect')
      if (Cypress.config('injectDocumentDomain')) {
        cy.location('href').should('eq', url4)
      } else {
        cy.origin('http://foobar.com:3501', { args: [url4] }, ([url4]) => {
          cy.location('href').should('eq', url4)
        })
      }
    })

    context('can intercept against any domain', function () {
      beforeEach(function () {
        // reset origin
        cy.visit('http://localhost:3500/fixtures/generic.html')
      })

      it('different origin (HTTP)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`).as('foo')
        .then(() => {
          $.get(`http://baz.foobar.com:3501${url}`)
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTP)', function () {
        cy.intercept('/fixtures/xhr.html*', (req) => {
          req.reply((res) => {
            expect(res.body).to.include('xhr fixture')
            res.body = 'replaced the body'
          })
        }).as('foo')
        .then(() => {
          return $.get('http://baz.foobar.com:3501/fixtures/xhr.html')
          .then((responseText) => {
            expect(responseText).to.eq('replaced the body')
          })
        })
        .wait('@foo').its('response.body').should('eq', 'replaced the body')
      })

      // @see https://github.com/cypress-io/cypress/issues/8487
      it('different origin (HTTPS)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, 'somethin').as('foo')
        .then(() => {
          $.get(`https://bar.foobar.com.invalid:3502${url}`)
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTPS)', function () {
        cy.intercept('/fixtures/xhr.html*', (req) => {
          req.reply((res) => {
            expect(res.body).to.include('xhr fixture')
            res.body = 'replaced the body'
          })
        }).as('foo')
        .then(() => {
          return $.get('https://bar.foobar.com:3502/fixtures/xhr.html')
          .then((responseText) => {
            expect(responseText).to.eq('replaced the body')
          })
        })
        .wait('@foo').its('response.body').should('eq', 'replaced the body')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/9599
    context('cors preflight', function () {
      // a different domain from the page own domain
      // NOTE: this domain is redirected back to the local host test server
      // using "hosts" setting in the "cypress.config.js" file
      let corsUrl = 'http://diff.foobar.com:3501/no-cors'

      beforeEach(() => {
        cy.visit('http://127.0.0.1:3500/fixtures/dom.html')
      })

      it('responds to OPTIONS requests', function () {
        // `/no-cors/` will respond with a 200, but missing valid preflight response
        cy.request({ method: 'OPTIONS', url: corsUrl })
        .then((res) => {
          expect(res.headers).to.not.have.property('access-control-allow-origin')

          // so this ajax request should fail due to CORS
          return $.ajax({ method: 'DELETE', url: corsUrl })
          .then(() => {
            throw new Error('should not succeed')
          })
          .catch((res) => {
            expect(res).to.include({ statusText: 'error' })
          })
        })
        .intercept('/no-cors', (req) => {
          req.reply(`intercepted ${req.method}`)
        })
        .then(() => {
          // but now, the same ajax request succeeds, because the cy.intercept provides CORS
          return $.ajax({ method: 'DELETE', url: corsUrl })
          .then((res) => {
            expect(res).to.eq('intercepted DELETE')
          })
        })
      })

      it('can be overwritten', function () {
        if (Cypress.isBrowser('webkit')) {
          // WebKit appears to cache successful OPTIONS responses that happen in quick succession
          // so append a number to the corsUrl so the previous test doesn't cause this one to fail
          corsUrl += 'v2'
        }

        cy.intercept('OPTIONS', '/no-cors*', (req) => {
          req.reply({
            headers: {
              'access-control-allow-origin': 'http://wrong.invalid',
            },
          })
        })
        .intercept('/no-cors*', (req) => {
          req.reply(`intercepted ${req.method}`)
        })
        .then(() => {
          return $.ajax({ method: 'DELETE', url: corsUrl })
          .then(() => {
            throw new Error('should not succeed')
          })
          .catch((res) => {
            expect(res).to.include({ statusText: 'error' })
          })
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/15050
    describe('cors expose header', () => {
      // a different domain from the page own domain
      const corsUrl = 'http://diff.foobar.com:3501/cors'

      beforeEach(() => {
        cy.visit('http://127.0.0.1:3500/fixtures/dom.html')
      })

      it('headers option is not set => no expose-header', () => {
        cy
        .intercept('/cors*', {})
        .as('corsRequest')
        .then(() => {
          return $.get(corsUrl)
        })

        cy.wait('@corsRequest').then((res) => {
          const headers = res.response?.headers

          expect(headers).to.not.have.property('access-control-expose-headers')
        })
      })

      it('headers option only has the accessible headers from the cors request => no expose-header', () => {
        cy
        .intercept('/cors*', {
          body: { success: true },
          headers: {
            'cache-control': 'no-cache',
            'content-language': 'en-US',
            'content-type': 'text/html',
            'Expires': 'Wed, 21 Oct 2015 07:28:00 GMT',
            'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
            'Pragma': 'no-cache',
          },
        })
        .as('corsRequest')
        .then(() => {
          return $.get(corsUrl)
        })

        cy.wait('@corsRequest').then((res) => {
          const headers = res.response?.headers

          expect(headers).to.not.have.property('access-control-expose-headers')
        })
      })

      it('headers option does not have the accessible header => include expose-header', () => {
        cy
        .intercept('/cors*', {
          body: { success: true },
          headers: {
            'cache-control': 'no-cache',
            'content-language': 'en-US',
            'x-token': 'token',
          },
        })
        .as('corsRequest')
        .then(() => {
          return $.get(corsUrl)
        })

        cy.wait('@corsRequest').then((res) => {
          const headers = res.response?.headers

          expect(headers!['access-control-expose-headers']).to.eq('*')
          expect(headers!['x-token']).to.eq('token')
        })
      })

      it('headers option has access-control-expose-headers => does not override', () => {
        cy
        .intercept('/cors*', {
          body: { success: true },
          headers: {
            'access-control-expose-headers': 'x-token',
            'x-token': 'token',
          },
        })
        .as('corsRequest')
        .then(() => {
          return $.get(corsUrl)
        })

        cy.wait('@corsRequest').then((res) => {
          const headers = res.response?.headers

          expect(headers!['access-control-expose-headers']).to.eq('x-token')
          expect(headers!['x-token']).to.eq('token')
        })
      })
    })
  })
})
