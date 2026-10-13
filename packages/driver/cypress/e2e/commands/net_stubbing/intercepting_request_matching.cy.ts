import { testFail, uniqueRoute, usesBrowserNetworkPath } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, sinon, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('intercepting request', function () {
    context('matches requests as expected', function () {
      it('handles querystrings as expected', function () {
        cy.intercept('*', 'it worked').as('final')
        .intercept({
          query: {
            foo: 'b*r',
            baz: /quu[x]/,
          },
        }).as('third')
        .intercept({
          path: '/abc?foo=bar&baz=qu*x*',
        }).as('second')
        .intercept({
          pathname: '/abc',
        }).as('first')
        .then(() => {
          return $.get('/abc?foo=bar&baz=quux')
        })
        .wait('@first')
        .wait('@second')
        .wait('@third')
        .wait('@final')
      })

      // @see https://github.com/cypress-io/cypress/issues/8921
      it('with case-insensitive header matching', function () {
        const url = uniqueRoute('/foo')

        cy.intercept({
          headers: {
            'X-some-Thing': 'foo',
          },
        })
        .as('foo')
        .then(() => {
          $.get({
            url,
            headers: {
              'X-SOME-THING': 'foo',
            },
          })
        })
        .wait('@foo')
      })

      // @see https://github.com/cypress-io/cypress/issues/9379
      context('falls back to matching by path if plain string is passed', function () {
        it('matches globs against path', function (done) {
          cy.intercept('/foo/*', (req) => {
            expect(req.url).to.include('/foo/1')
            done()
          })
          .then(() => {
            $.ajax({ url: '/foo/1', cache: true })
          })
        })

        it('matches nested globs against path', function (done) {
          cy.intercept('/foo/*/bar', (req) => {
            expect(req.url).to.match(/\/foo\/1\/bar$/)
            done()
          })
          .then(() => {
            $.get({ url: '/foo/1/bar', cache: true })
          })
        })
      })

      context('with `times`', function () {
        // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23434
        it('only uses each handler N times', { browser: '!webkit', retries: 15 }, function () {
          const url = uniqueRoute('/foo')
          const third = sinon.stub()

          cy
          .intercept({ url: `${url}*`, times: 3 }, 'fourth').as('4')
          .intercept({ url: `${url}*`, times: 2 }, third).as('3')
          .intercept({ url: `${url}*`, times: 2 }, 'second').as('2')
          .intercept({ url: `${url}*`, times: 1 }, 'first').as('1')
          .then(async () => {
            const expectGet = (expected) => $.get(url).then((res) => expect(res).to.eq(expected))

            await Promise.mapSeries([
              'first',
              'second',
              'second',
              'fourth',
              'fourth',
              'fourth',
            ], expectGet)

            expect(third).to.be.calledTwice

            // now that matches are exhausted, it should fall through
            await $.get(url).catch((xhr) => {
              expect(xhr).to.include({
                status: 404,
              })
            })
          })
          .get('@1.all').should('have.length', 1)
          .get('@2.all').should('have.length', 2)
          .get('@3.all').should('have.length', 2)
          .get('@4.all').should('have.length', 3)
        })

        context('stopPropagation: true', () => {
          it('works with continue', () => {
            cy.intercept({
              method: 'POST',
              times: 1,
              url: '/post-only',
            },
            (req) => {
              req.continue((res) => {
                res.body = 'stubbed data'
              })
            }).as('interceptor')

            cy.visit('fixtures/request.html')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'stubbed data')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'client')
          })

          it('works with reply', () => {
            cy.intercept({
              method: 'POST',
              times: 1,
              url: '/post-only',
            },
            (req) => {
              req.reply('stubbed data')
            }).as('interceptor')

            cy.visit('fixtures/request.html')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'stubbed data')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'client')
          })

          it('works with reply and fallthrough', () => {
            let times = 0

            cy.intercept({
              method: 'POST',
              times: 3,
              url: '/post-only',
            },
            (req) => {
              req.reply(`${req.body === 'foo' ? 'foo' : 'nothing'} stubbed data ${times++}`)
            })

            cy.intercept({
              method: 'POST',
              times: 2,
              url: '/post-only',
            },
            (req) => {
              req.body = 'foo'
            })

            cy.visit('fixtures/request.html')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'foo stubbed data 0')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'foo stubbed data 1')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'nothing stubbed data 2')

            cy.get('#request').click()
            cy.get('#result').should('contain', 'client')
          })
        })
      })

      context('with `resourceType`', function () {
        it('can match a proxied image request by resourceType', () => {
          cy.intercept({ resourceType: 'image' }, (req) => {
            expect(req.resourceType).to.eq('image')
            req.reply({ fixture: 'media/cypress.png' })
          })
          .as('imagesOnly')
          .then(async () => {
            await Promise.all([
              // should not match
              fetch('/'),
              // should match
              new Promise((resolve) => {
                $('<img src="/image">')[0].onload = () => resolve()
              }),
            ])
          })
          .get('@imagesOnly.all').should('have.length', 1)
        })

        it('can match a cy.visit() document request by resourceType', () => {
          cy.intercept({ resourceType: 'document' }, (req) => {
            expect(req.resourceType).to.eq('document')
            req.reply({ fixture: 'content-in-body.html' })
          })
          .as('documentsOnly')
          .visit('/stubbed-html.html') // should match
          .contains('Script and Style in the body')
          .then(() => fetch('/')) // should not match
          .get('@documentsOnly.all').should('have.length', 1)
        })
      })
    })

    context('with StaticResponse shorthand', function () {
      it('req.reply(body)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply('baz')
        })
        .then(() => $.get(url))
        .should('eq', 'baz')
      })

      it('req.reply(json)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply({ baz: 'quux' })
        })
        .then(() => $.getJSON(url))
        .should('deep.eq', { baz: 'quux' })
      })

      it('req.reply(status)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply(777)
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get(url).fail((x) => resolve(x.status))
          })
        })
        .should('eq', 777)
      })

      it('req.reply(status, body)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply(777, 'bar')
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get(url).fail((xhr) => resolve(_.pick(xhr, 'status', 'responseText')))
          })
        }).should('include', {
          status: 777,
          responseText: 'bar',
        })
      })

      it('req.reply(status, json)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply(777, { bar: 'baz' })
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get(url).fail((xhr) => resolve(_.pick(xhr, 'status', 'responseJSON')))
          })
        }).should('deep.include', {
          status: 777,
          responseJSON: { bar: 'baz' },
        })
      })

      it('req.reply(status, json, headers)', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply(777, { bar: 'baz' }, { 'x-quux': 'quuz' })
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get(url).fail((xhr) => resolve(_.pick(xhr, 'status', 'responseJSON', 'getAllResponseHeaders')))
          })
        }).should('deep.include', {
          status: 777,
          responseJSON: { bar: 'baz' },
        }).invoke('getAllResponseHeaders')
        .should('include', 'x-quux: quuz')
        .and('include', 'content-type: application/json')
      })

      it('can forceNetworkError', function (done) {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, function (req) {
          req.reply({ forceNetworkError: true })
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
    })

    context('request handler chaining', function () {
      it('passes request through in reverse order', function () {
        cy.intercept('/dump-method', function (req) {
          expect(req.method).to.eq('PATCH')

          req.reply()
        }).intercept('/dump-method', function (req) {
          expect(req.method).to.eq('POST')
          req.method = 'PATCH'
        }).intercept('/dump-method', function (req) {
          expect(req.method).to.eq('GET')
          req.method = 'POST'
        }).visit('/dump-method').contains('PATCH')
      })

      it('stops passing request through once req.reply called', function () {
        cy.intercept('/dump-method', function (req) {
          throw new Error('this should not have been reached')
        }).intercept('/dump-method', function (req) {
          req.reply()
        }).visit('/dump-method').contains('GET')
      })
    })

    context('errors', function () {
      it('fails test if req.reply is called twice in req handler', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('`req.reply()` and/or `req.continue()` were called to signal request completion multiple times, but a request can only be completed once')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          req.reply()

          req.reply()
        }).visit('/dump-method')
      })

      it('fails test if both req.reply and req.continue are called in req handler', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('`req.reply()` and/or `req.continue()` were called to signal request completion multiple times, but a request can only be completed once')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          req.reply()

          req.continue()
        }).visit('/dump-method')
      })

      it('fails test if req.destroy is called after req.reply in req handler', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          expect(err.message).to.contain('`req.reply()` and/or `req.continue()` were called to signal request completion multiple times, but a request can only be completed once')
          done()
        })

        cy.intercept(url, function (req) {
          req.reply()

          req.destroy()
        }).visit(url)
      })

      it('fails test if req.continue is called with a non-function parameter', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('\`req.continue\` requires the parameter to be a function')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          req.continue({} as any)
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler finishes', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler resolves', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)

          return Promise.resolve()
        }).visit('/dump-method')
      })

      it('fails test if req.destroy is called after req handler finishes', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.destroy(), 50)
        }).visit('/dump-method')
      })

      it('fails test if req.destroy is called after req handler resolves', function (done) {
        testFail((err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.destroy(), 50)

          return Promise.resolve()
        }).visit('/dump-method')
      })

      it('fails test if an exception is thrown in req handler', function (done) {
        const url = uniqueRoute('/foo')

        cy.on('fail', (err2) => {
          expect(err2).to.eq(err)

          done()
        })

        const err = new Error('bar')

        cy.intercept(url, () => {
          throw err
        }).visit(url)
      })

      it('fails test if req.reply is called with an invalid StaticResponse', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          expect(err.message).to.contain('must be a number between 100 and 999 (inclusive).')

          done()
        })

        cy.intercept(url, (req) => {
          req.reply({ statusCode: 1 })
        }).visit(url)
      })

      it('can timeout in request handler', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          Cypress.config('defaultCommandTimeout', 5000)
          expect(err.message).to.match(/^A request callback passed to `cy.intercept\(\)` timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

          done()
        })

        Cypress.config('defaultCommandTimeout', 50)

        cy.intercept(url, () => {
          return Promise.delay(200)
        }).visit(url)
      })
    })

    context('correctly determines the content-length of an intercepted request', function () {
      it('when body is empty', function (done) {
        cy.intercept('/post-only', function (req) {
          // NOTE: accepted MITM → CDP drift (#34611): content-length is absent from
          // the paused request — the browser sets it on the wire, so proxy-off there
          // is no value to recompute from and none is synthesized for an emptied body.
          if (usesBrowserNetworkPath) {
            expect(req.headers['content-length']).to.be.undefined
          } else {
            expect(req.headers['content-length']).to.eq('0')
          }

          done()
        }).intercept('/post-only', function (req) {
          req.body = ''
        })
        .then(() => {
          $.post('/post-only', 'foo')
        })
      })

      it('when body contains ascii', function () {
        cy.intercept('/post-only', function (req) {
          expect(req.headers['content-length']).to.eq('18')
        }).intercept('/post-only', function (req) {
          req.body = 'this is only ascii'
        })
        .then(() => {
          $.post('/post-only', 'bar')
        })
      })

      it('when body contains unicode', function () {
        cy.intercept('/post-only', function (req) {
          expect(req.headers['content-length']).to.eq('8')
        }).intercept('/post-only', function (req) {
          req.body = '🙃🤔'
        })
        .then(() => {
          $.post('/post-only', 'baz')
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/24407
      it('does not calculate content-length on spied request if one does not exist on the initial request (if merging)', { retries: 0 }, function (done) {
        cy.intercept('/verify-content-length-is-absent*', function (req) {
          // modify the intercepted request to trigger a request merge in net_stubbing
          req.headers['foo'] = 'bar'
          // send the modified request and skip any other
          // matching request handlers
          req.continue()
        }).then(async () => {
          const isContentLengthHeaderAbsent = await $.get('/verify-content-length-is-absent')

          expect(isContentLengthHeaderAbsent).to.be.true
          done()
        })
      })
    })
  })
})
