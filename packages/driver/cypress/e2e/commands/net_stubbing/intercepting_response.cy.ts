import { testFail, uniqueRoute, usesBrowserNetworkPath } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('intercepting response', function () {
    it('receives the original response in handler', function (done) {
      cy.intercept('/json-content-type*', function (req) {
        req.reply(function (res) {
          expect(res.body).to.deep.eq({})

          done()
        })

        expect(req.url).to.match(/^http:\/\/localhost:3500\/json-content-type/)
      }).then(function () {
        $.get('/json-content-type')
      })
    })

    // A custom phrase can only have come off the wire, so this fails if the
    // phrase is reconstructed from the status code instead of read.
    it('receives the origin reason phrase as res.statusMessage', function (done) {
      cy.intercept('/status-code*', function (req) {
        req.reply(function (res) {
          expect(res.statusMessage).to.eq('Totally Fine')

          done()
        })
      }).then(function () {
        $.get('/status-code?code=200&message=Totally%20Fine')
      })
    })

    it('intercepts redirects as expected', function () {
      const href = `/fixtures/generic.html?t=${Date.now()}`
      const url = `/redirect?href=${encodeURIComponent(href)}`

      cy.intercept('/redirect?href=*', (req) => {
        req.reply((res) => {
          expect(res.statusCode).to.eq(301)
          expect(res.headers.location).to.eq(href)
          res.send()
        })
      })
      .as('redirect')
      .intercept('/fixtures/generic.html?t=*').as('dest')
      .then(() => fetch(url))
      .wait('@redirect')
      .wait('@dest')
    })

    it('can simply wait on redirects without intercepting', function () {
      const href = `/fixtures/generic.html?t=${Date.now()}`
      const url = `/redirect?href=${encodeURIComponent(href)}`

      cy.intercept('/redirect*')
      .as('redirect')
      .intercept('/fixtures/generic.html*').as('dest')
      .then(() => fetch(url))
      .wait('@redirect')
      .wait('@dest')
    })

    // @see https://github.com/cypress-io/cypress/issues/7967
    it('can skip redirects via followRedirect', function () {
      const href = `/fixtures/generic.html?t=${Date.now()}`
      const url = `/redirect?href=${encodeURIComponent(href)}`

      cy.intercept('/redirect', (req) => {
        req.followRedirect = true
        req.reply((res) => {
          expect(res.body).to.include('Some generic content')
          expect(res.statusCode).to.eq(200)
          res.send()
        })
      })
      .then(() => fetch(url))
    })

    it('intercepts cached responses as expected', {
      // TODO: why does firefox behave differently? transparently returns cached response
      // TODO(webkit): fix+unskip. currently fails in WK because cache is disabled
      browser: { family: 'chromium' },
    }, function () {
      cy.visit('/fixtures/empty.html')

      // use a queryparam to bust cache from previous runs of this test
      const url = `/fixtures/generic.html?t=${Date.now()}`
      let hits = 0

      cy.intercept('/fixtures/generic.html*', (req) => {
        req.reply((res) => {
          // the second time the request is sent, headers should have been passed
          // that result in Express serving a 304
          // Cypress is not expected to understand cache mechanisms at this point -
          // if the user wants to break caching, they can DIY by editing headers
          // NOTE: accepted MITM → CDP drift (#34611): the browser's HTTP cache sits
          // between the origin and the Fetch pause, so revalidation is resolved before
          // we see it and the second hit is reported as another 200 rather than a 304.
          const expectedStatusCode = (usesBrowserNetworkPath ? [200, 200] : [200, 304])[hits]

          expect(expectedStatusCode).to.exist
          expect(res.statusCode).to.eq(expectedStatusCode)

          hits++
          res.send()
        })
      })
      .as('foo')
      .then(() => _.times(2, () => fetch(url)))
      .wait('@foo')
      .wait('@foo')
      .then(() => {
        expect(hits).to.eq(2)
      })
    })

    it('can intercept a large proxy response', function (done) {
      cy.intercept('/1mb', (req) => {
        req.reply((res) => {
          res.send()
        })
      }).then(() => {
        $.get('/1mb').done((responseText) => {
          // NOTE: the log from this when it fails is so long that it causes the browser to lock up :[
          expect(responseText).to.eq('X'.repeat(1024 * 1024))

          done()
        })
      })
    })

    it('can delay a proxy response using res.setDelay', function (done) {
      const delay = 1000

      cy.intercept('/timeout*', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.setDelay(delay).send('delay worked')
        })
      }).then(() => {
        $.get('/timeout')
        .done((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(delay + 100, 100)
          expect(responseText).to.include('delay worked')

          done()
        })
      })
    })

    it('can \'delay\' a proxy response using Promise.delay', function (done) {
      const delay = 1000

      cy.intercept('/timeout*', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          return Promise.delay(delay)
          .then(() => {
            res.headers['content-type'] = 'text/plain'
            res.send('Promise.delay worked')
          })
        })
      }).then(() => {
        $.get('/timeout').then((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(delay + 100, 100)
          expect(responseText).to.eq('Promise.delay worked')

          done()
        })
      })
    })

    it('can throttle a proxy response using res.setThrottle', function (done) {
      cy.intercept('/1mb*', (req) => {
        // don't let gzip make response smaller and throw off the timing
        delete req.headers['accept-encoding']

        req.reply((res) => {
          this.start = Date.now()

          res.setThrottle(1024).send()
        })
      }).then(() => {
        $.get('/1mb').done((responseText) => {
          // 1MB @ 1MB/s = ~1 second
          expect(Date.now() - this.start).to.be.closeTo(1000, 250)
          expect(responseText).to.eq('X'.repeat(1024 * 1024))

          done()
        })
      })
    })

    it('can throttle a static response using res.setThrottle', function (done) {
      const payload = 'A'.repeat(10 * 1024)
      const kbps = 10
      const expectedSeconds = payload.length / (1024 * kbps)

      cy.intercept('/timeout*', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.headers['content-type'] = 'text/plain'
          res.setThrottle(kbps).send(payload)
        })
      }).then(() => {
        $.get('/timeout').done((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000, 250)
          expect(responseText).to.eq(payload)

          done()
        })
      })
    })

    it('can delay and throttle a static response', function (done) {
      const payload = 'A'.repeat(10 * 1024)
      const kbps = 20
      let expectedSeconds = payload.length / (1024 * kbps)
      const delay = 500

      expectedSeconds += delay / 1000

      cy.intercept('/timeout*', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.headers['content-type'] = 'text/plain'
          res.setThrottle(kbps).setDelay(delay).send({
            statusCode: 200,
            body: payload,
          })
        })
      }).then(() => {
        $.get('/timeout').done((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000, 100)
          expect(responseText).to.eq(payload)

          done()
        })
      })
    })

    it('can reply with a JSON fixture', function () {
      cy.intercept({
        method: 'POST',
        url: '/test-xhr',
      }, (req) => {
        req.url = '/timeout'
        req.method = 'GET'
        req.reply((res) => {
          res.send({
            headers: {
              'content-type': 'application/json',
            },
            fixture: 'valid.json',
          })
        })
      }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

      cy.contains('{"foo":1,"bar":{"baz":"cypress"}}')
    })

    it('can delete a response header', function () {
      cy
      .then(() => {
        const xhr = $.get('/json-content-type')

        return xhr.then(() => {
          return xhr.getAllResponseHeaders()
        })
      })
      .should('include', 'content-type: application/json')
      .intercept('/json-content-type*', function (req) {
        req.reply((res) => {
          delete res.headers['content-type']
        })
      }).as('get')
      .then(() => {
        const xhr = $.get('/json-content-type')

        return xhr.then(() => {
          return xhr.getAllResponseHeaders()
        })
      })
      .should('not.include', 'content-type')
      .wait('@get')
    })

    // https://github.com/cypress-io/cypress/issues/17084
    it('does not overwrite the json-related content-type header', () => {
      cy.intercept('/json-content-type', (req) => {
        req.on('response', (res) => {
          res.send({
            statusCode: 500,
            headers: {
              'content-type': 'application/problem+json',
              'access-control-allow-origin': '*',
            },
            body: {
              status: 500,
              title: 'Internal Server Error',
            },
          })
        })
      })
      .then(() => {
        return fetch('/json-content-type')
        .then((res) => {
          expect(res.headers.get('content-type')).to.eq('application/problem+json')
        })
      })
    })

    context('body parsing', function () {
      [
        'application/json',
        'application/vnd.api+json',
      ].forEach((contentType) => {
        it(`automatically parses ${contentType} response bodies`, function () {
          const p = Promise.defer()

          cy.intercept(`/json-content-type*`, (req) => {
            req.reply((res) => {
              expect(res.headers['content-type']).to.eq(contentType)
              expect(res.body).to.deep.eq({})
              p.resolve()
            })
          }).as('get')
          .then(() => {
            return $.get(`/json-content-type?contentType=${encodeURIComponent(contentType)}`)
          }).then((responseJson) => {
            expect(responseJson).to.deep.eq({})

            return p
          })
          .wait('@get').its('response.body').should('deep.eq', {})
        })
      })

      it('doesn\'t automatically parse JSON response bodies if content-type is wrong', function () {
        const p = Promise.defer()

        cy.intercept('/fixtures/json.txt*', (req) => {
          req.reply((res) => {
            expect(res.body).to.eq('{ "foo": "bar" }')
            p.resolve()
          })
        }).as('get')
        .then(() => {
          return $.get('/fixtures/json.txt')
        }).then((responseText) => {
          expect(responseText).to.deep.eq('{ "foo": "bar" }')

          return p
        })
        .wait('@get').its('response.body').should('deep.eq', '{ "foo": "bar" }')
      })

      // @see https://github.com/cypress-io/cypress/issues/16722
      it('doesn\'t automatically parse response bodies if content is binary', function () {
        const expectedBody = [120, 42, 7]
        const assertBody = (body: ArrayBuffer) => {
          const uint8 = new Uint8Array(body)

          expectedBody.forEach((value, index) => {
            expect(uint8[index]).to.eq(value)
          })
        }

        cy.intercept('/binary*', (req) => {
          req.on('response', (res) => {
            expect(_.isArrayBuffer(res.body)).to.eq(true)
            assertBody(res.body)
          })
        }).as('get')
        .visit('/fixtures/display-binary.html')
        .wait('@get').its('response.body').should(assertBody)
        .get('#result').should('have.text', expectedBody.join(', '))
      })

      it('sets body to string if JSON is malformed', function () {
        const p = Promise.defer()

        cy.intercept('/fixtures/invalid.json*', (req) => {
          req.reply((res) => {
            expect(res.headers['content-type']).to.match(/^application\/json/)
            expect(res.body).to.eq('{ foo:::: }')
            p.resolve()
          })
        }).as('get')
        .then(() => {
          return $.get('/fixtures/invalid.json').catch(() => p)
        })
        .wait('@get').its('response.body').should('deep.eq', '{ foo:::: }')
      })
    })

    context('with StaticResponse', function () {
      it('res.send(body)', function () {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.headers['content-type'] = 'text/plain'
            res.send('baz')
          })
        })
        .then(() => {
          return $.get('/custom-headers')
          .then((_a, _b, xhr) => {
            expect(xhr.status).to.eq(200)
            expect(xhr.responseText).to.eq('baz')
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar')
          })
        })
      })

      it('res.send(json)', function () {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.send({ baz: 'quux' })
          })
        })
        .then(() => {
          return $.getJSON('/custom-headers')
          .then((data, _b, xhr) => {
            expect(xhr.status).to.eq(200)
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar')
            .and.include('content-type: application/json')

            expect(data).to.deep.eq({ baz: 'quux' })
          })
        })
      })

      it('res.send(status)', function (done) {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.send(777)
          })
        })
        .then(() => {
          $.getJSON('/custom-headers')
          .fail((xhr) => {
            expect(xhr.status).to.eq(777)
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar')

            expect(xhr.responseText).to.include('hello there')

            done()
          })
        })
      })

      it('res.send(status, body)', function (done) {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.headers['content-type'] = 'text/plain'
            res.send(777, 'bar')
          })
        })
        .then(() => {
          $.get('/custom-headers')
          .fail((xhr) => {
            expect(xhr.status).to.eq(777)
            expect(xhr.responseText).to.eq('bar')
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar')

            done()
          })
        })
      })

      it('res.send(status, json)', function (done) {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.send(777, { bar: 'baz' })
          })
        })
        .then(() => {
          $.getJSON('/custom-headers')
          .fail((xhr) => {
            expect(xhr.status).to.eq(777)
            expect(xhr.responseJSON).to.deep.eq({ bar: 'baz' })
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar')
            .and.include('content-type: application/json')

            done()
          })
        })
      })

      it('res.send(status, json, headers)', function (done) {
        cy.intercept('/custom-headers*', function (req) {
          req.reply((res) => {
            res.send(777, { bar: 'baz' }, { 'x-quux': 'quuz' })
          })
        })
        .then(() => {
          $.getJSON('/custom-headers')
          .fail((xhr) => {
            expect(xhr.status).to.eq(777)
            expect(xhr.responseJSON).to.deep.eq({ bar: 'baz' })
            expect(xhr.getAllResponseHeaders())
            .to.include('x-foo: bar') // headers should be merged
            .and.include('x-quux: quuz')
            .and.include('content-type: application/json')

            done()
          })
        })
      })

      it('res.send({ fixture })', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply((res) => {
            res.headers['content-type'] = 'application/json'
            res.send({
              statusCode: 200,
              fixture: 'valid.json',
            })
          })
        })
        .then(() => {
          return $.getJSON(url)
        })
        .should('include', { foo: 1 })
      })

      it('can forceNetworkError', function (done) {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply((res) => {
            res.send({ forceNetworkError: true })
          })
        })
        .then(() => {
          $.get(url).fail((xhr) => {
            expect(xhr).to.include({
              status: 0,
              statusText: 'error',
              readyState: 0,
            })

            done()
          })
        })
      })

      it('can delay and throttle', function (done) {
        const payload = 'A'.repeat(10 * 1024)
        const throttleKbps = 50
        const delay = 50
        const expectedSeconds = payload.length / (1024 * throttleKbps) + delay / 1000

        cy.intercept('/timeout*', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            res.headers['content-type'] = 'text/plain'
            // ensure .throttle and .delay are overridden
            res.setThrottle(1e6).setDelay(1).send({
              statusCode: 200,
              body: payload,
              throttleKbps,
              delay,
            })
          })
        }).then(() => {
          return $.get('/timeout').then((responseText) => {
            expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000 + 475, 500)
            expect(responseText).to.eq(payload)

            done()
          })
        })
      })
    })

    context('response handler chaining', function () {
      it('passes response through in reverse order', function () {
        cy.intercept('/dump-method', function (req) {
          req.reply((res) => {
            expect(res.body).to.contain('new body')
          })
        }).intercept('/dump-method', function (req) {
          req.reply((res) => {
            expect(res.body).to.contain('GET')
            res.body = 'new body'
          })
        }).visit('/dump-method')
        .contains('new body')
      })

      it('stops passing response through once res.send called', function () {
        cy.intercept('/dump-method', function (req) {
          req.reply((res) => {
            throw new Error('this should not have been reached')
          })
        }).intercept('/dump-method', function (req) {
          req.reply((res) => {
            res.send()
          })
        }).visit('/dump-method').contains('GET')
      })
    })

    context('errors', function () {
      it('fails test if res.send is called twice in req handler', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('`res.send()` was called multiple times in a response handler, but the response can only be sent once.')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          req.reply(function (res) {
            res.send()

            res.send()
          })
        }).visit('/dump-method')
      })

      it('fails test if an exception is thrown in res handler', function (done) {
        const url = uniqueRoute('/foo')

        cy.on('fail', (err2) => {
          expect(err2).to.eq(err)
          done()
        })

        const err = new Error('bar')

        cy.intercept(`${url}*`, (req) => {
          req.reply(() => {
            throw err
          })
        })
        .then(() => {
          $.get(url)
        })
        .wait(1000)
      })

      it('fails test if res.send is called with an invalid StaticResponse', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          expect(err.message).to.include('must be a number between 100 and 999 (inclusive).')

          done()
        })

        cy.intercept(`${url}*`, (req) => {
          req.reply((res) => {
            res.send({ statusCode: 1 })
          })
        })
        .then(() => {
          $.get(url)
        })
      })

      it('fails test if network error occurs retrieving response and response is intercepted', function (done) {
        testFail((err) => {
          expect(err.message)
          .to.contain('A callback was provided to intercept the upstream response, but a network error occurred while making the request:')
          .and.contain('Error: connect ECONNREFUSED 127.0.0.1:3333')

          done()
        })

        // TODO: added `times: 1` because this test is very flaky. we should investigate the root cause
        // (it seems like we are getting multiple requests and that is triggering the issue)
        // https://github.com/orgs/cypress-io/projects/10/views/22?pane=issue&itemId=32520743
        cy.intercept('/should-err*', { times: 1 }, function (req) {
          req.reply(() => {})
        }).then(function () {
          $.get('http://127.0.0.1:3333/should-err')
        })
      })

      it('doesn\'t fail test if network error occurs retrieving response and response is not intercepted', {
        // TODO: for some reason, this test is busted in FF
        browser: '!firefox',
      }, function () {
        cy.intercept('/should-err*', function (req) {
          req.reply()
        })
        .as('err')
        .then(function () {
          return new Promise((resolve) => {
            $.get('http://127.0.0.1:3333/should-err')
            .fail((xhr) => {
              expect(xhr).to.include({
                status: 0,
                statusText: 'error',
              })

              resolve()
            })
          })
        })
        .wait('@err', { timeout: 50 })
      })

      it('can timeout in req.reply handler', function (done) {
        testFail((err) => {
          Cypress.config('defaultCommandTimeout', 5000)
          expect(err.message).to.match(/^A response handler timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

          done()
        })

        cy.intercept('/timeout', (req) => {
          Cypress.config('defaultCommandTimeout', 50)

          req.reply(() => {
            return Promise.delay(200)
          })
        })
        .visit('/timeout')
      })

      it('can timeout when retrieving upstream response', {
        responseTimeout: 25,
      }, function (done) {
        if (usesBrowserNetworkPath) {
          // NOTE: accepted MITM → CDP drift (#34611): responseTimeout bounds the
          // upstream request Cypress makes itself. Proxy-off the browser owns that
          // request, so there is no Cypress-side socket to time out and no error to
          // assert — the response arrives normally instead.
          this.skip()

          return
        }

        cy.once('fail', (err) => {
          expect(err.message).to.match(/^A callback was provided to intercept the upstream response, but the request timed out after the `responseTimeout` of `25ms`\./)
          .and.match(/ESOCKETTIMEDOUT|ETIMEDOUT/)

          done()
        })

        // TODO: added `times: 1` because this test is very flaky. we should investigate the root cause
        // (it seems like we are getting multiple requests and that is triggering the issue)
        // https://github.com/orgs/cypress-io/projects/10/views/22?pane=issue&itemId=32520743
        cy.intercept('/timeout*', { times: 1 }, (req) => {
          req.reply(_.noop)
        }).then(() => {
          $.get('/timeout?ms=50')
        })
      })
    })
  })
})
