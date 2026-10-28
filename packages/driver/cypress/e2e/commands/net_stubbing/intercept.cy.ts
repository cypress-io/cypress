import { getDisplayUrlMatcher } from '../../../../src/cy/net-stubbing/route-matcher-log'
import type { RouteMatcherOptions } from '@packages/network-interception'
import { testFail, uniqueRoute } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, sinon, state, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('cy.intercept()', function () {
    context('emits as expected', function () {
      beforeEach(function () {
        // we don't use cy.spy() because it causes an infinite loop with logging events
        this.sandbox = sinon.createSandbox()
        this.emit = this.sandbox.spy(Cypress, 'emit').withArgs('backend:request', 'net', 'route:added')

        this.testRoute = function (options, handler, expectedEvent, expectedRoute) {
          cy.intercept(options, handler).then(function () {
            const routeId = _.findKey(state('routes'), { handler })
            const route = state('routes')[routeId!]

            expectedEvent.routeId = routeId
            expect(this.emit).to.be.calledWith('backend:request', 'net', 'route:added', expectedEvent)

            expect(route.handler).to.deep.eq(expectedRoute.handler)
            expect(route.options).to.deep.eq(expectedRoute.options)
          })
        }
      })

      afterEach(function () {
        this.sandbox.restore()
      })

      it('url, body and stores Route', function () {
        const handler = 'bar'
        const url = uniqueRoute('http://foo.invalid')
        const expectedEvent = {
          routeMatcher: {
            url: {
              type: 'glob',
              value: url,
            },
          },
          staticResponse: {
            body: 'bar',
          },
          hasInterceptor: false,
        }

        const expectedRoute = {
          options: { url },
          handler,
        }

        this.testRoute(url, handler, expectedEvent, expectedRoute)
      })

      it('url, HTTPController and stores Route', function () {
        const handler = () => {
          return {}
        }

        const url = uniqueRoute('http://foo.invalid')
        const expectedEvent = {
          routeMatcher: {
            url: {
              type: 'glob',
              value: url,
            },
          },
          hasInterceptor: true,
        }

        const expectedRoute = {
          options: { url },
          handler,
        }

        this.testRoute(url, handler, expectedEvent, expectedRoute)
      })

      it('regex values stringified and other values copied and stores Route', function () {
        const handler = () => {
          return {}
        }

        const options = {
          auth: {
            username: 'foo',
            password: /.*/,
          },
          headers: {
            'Accept-Language': /hylian/i,
            'Content-Encoding': 'corrupted',
          },
          hostname: /any.com/,
          https: true,
          method: 'POST',
          path: '/bing?foo',
          pathname: '/bazz',
          port: [1, 2, 3, 4, 5, 6],
          query: {
            bar: 'baz',
            quuz: /(.*)quux/gi,
          },
          url: uniqueRoute('http://foo.invalid'),
        }

        const expectedEvent = {
          routeMatcher: {
            auth: {
              username: {
                type: 'glob',
                value: options.auth.username,
              },
              password: {
                type: 'regex',
                value: '/.*/',
              },
            },
            headers: {
              'accept-language': {
                type: 'regex',
                value: '/hylian/i',
              },
              'content-encoding': {
                type: 'glob',
                value: options.headers['Content-Encoding'],
              },
            },
            hostname: {
              type: 'regex',
              value: '/any.com/',
            },
            https: options.https,
            method: {
              type: 'glob',
              value: options.method,
            },
            path: {
              type: 'glob',
              value: options.path,
            },
            pathname: {
              type: 'glob',
              value: options.pathname,
            },
            port: options.port,
            query: {
              bar: {
                type: 'glob',
                value: options.query.bar,
              },
              quuz: {
                type: 'regex',
                value: '/(.*)quux/gi',
              },
            },
            url: {
              type: 'glob',
              value: options.url,
            },
          },
          hasInterceptor: true,
        }

        const expectedRoute = {
          options,
          handler,
        }

        this.testRoute(options, handler, expectedEvent, expectedRoute)
      })

      it('mergeRouteMatcher + string url works', function () {
        const url = uniqueRoute('/foo')

        const handler = (req) => {
          const routeId = _.findKey(state('routes'), { handler })
          const route = state('routes')[routeId!]

          // @ts-expect-error - `routeId` is not part of the expected event literal
          expectedEvent.routeId = routeId
          expect(this.emit).to.be.calledWith('backend:request', 'net', 'route:added', expectedEvent)

          expect(route.handler).to.deep.eq(expectedRoute.handler)
          expect(route.options).to.deep.eq(expectedRoute.options)

          req.reply('a')
        }

        const expectedRoute = {
          options: { url: `${url}*`, middleware: true },
          handler,
        }

        const expectedEvent = {
          routeMatcher: {
            url: {
              type: 'glob',
              value: `${url}*`,
            },
            middleware: true,
          },
          hasInterceptor: true,
        }

        cy.intercept(`${url}*`, { middleware: true }, handler).as('get')
        .then(() => {
          return $.get(url)
        })
        .wait('@get')
      })

      // @see https://github.com/cypress-io/cypress/pull/16390
      it('mergeRouteMatcher + regex url works', function () {
        const url = uniqueRoute('/foo')
        const regexUrl = new RegExp(`^${url}.*`)

        const handler = (req) => {
          const routeId = _.findKey(state('routes'), { handler })
          const route = state('routes')[routeId!]

          // @ts-expect-error - `routeId` is not part of the expected event literal
          expectedEvent.routeId = routeId
          expect(this.emit).to.be.calledWith('backend:request', 'net', 'route:added', expectedEvent)

          expect(route.handler).to.deep.eq(expectedRoute.handler)
          expect(route.options).to.deep.eq(expectedRoute.options)

          req.reply('a')
        }

        const expectedRoute = {
          options: { url: regexUrl, middleware: true },
          handler,
        }

        const expectedEvent = {
          routeMatcher: {
            url: {
              type: 'regex',
              value: String(regexUrl),
            },
            middleware: true,
          },
          hasInterceptor: true,
        }

        cy.intercept(regexUrl, { middleware: true }, handler).as('get')
        .then(() => {
          return $.get(url)
        })
        .wait('@get')
      })
    })

    // https://github.com/cypress-io/cypress/issues/8729
    it('resolve ambiguity between overloaded definitions', () => {
      cy.intercept('POST', '/post-only').as('create')

      cy.window().then((win) => {
        win.eval(
          `fetch("/post-only", {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
          });`,
        )
      })

      cy.wait('@create')
    })

    // https://github.com/cypress-io/cypress/issues/9313
    it('lower-cased method works', () => {
      cy.intercept({
        method: 'post',
        url: '/post-only',
      }).as('create')

      cy.window().then((win) => {
        win.eval(
          `fetch("/post-only", {
            method: 'post', // *GET, POST, PUT, DELETE, etc.
          });`,
        )
      })

      cy.wait('@create')
    })

    // @see https://github.com/cypress-io/cypress/issues/28282
    it('QUERY method shorthand is treated as a method, not a url', () => {
      cy.intercept('QUERY', '/query-only', { statusCode: 200, body: 'ok' }).as('query')

      cy.window().then((win) => {
        win.eval(
          `fetch("/query-only", {
            method: 'QUERY',
          });`,
        )
      })

      cy.wait('@query').its('request.method').should('eq', 'QUERY')
    })

    // @see https://github.com/cypress-io/cypress/issues/16117
    it('can statically stub a url response with headers', () => {
      cy.intercept('/url', { headers: { foo: 'bar' }, body: 'something' })
    })

    it('does not intercept an XHR sync request with a route handler', () => {
      cy.intercept('/', {
        body: `
          <!DOCTYPE html>
          <html>
          <body>
            <div id="sync_response"></div>
            <div id="async_response"></div>
            <script>
              const xhr = new window.XMLHttpRequest()
              xhr.open('GET', '/fixtures/valid.json', false)
              xhr.send()
              document.querySelector('#sync_response').innerHTML = JSON.stringify(JSON.parse(xhr.responseText))

              const xhr2 = new window.XMLHttpRequest()
              xhr2.open('GET', '/async', true)
              xhr2.onload = () => {
                document.querySelector('#async_response').innerHTML = xhr2.responseText
              }
              xhr2.send()
            </script>
          </body>
          </html>
        `,
      })

      // this intercept won't get hit because the request is sync
      cy.intercept('/fixtures/valid.json', () => {}).as('sync')

      // this intercept will get hit because the request is async
      cy.intercept('/async', (req) => {
        req.reply({ body: 'async' })
      }).as('async')

      cy.visit('/')
      cy.get('#sync_response').should('contain', '{"foo":1,"bar":{"baz":"cypress"}}')
      cy.get('#async_response').should('contain', 'async')
      cy.wait('@async')
    })

    it('does not intercept a cross-origin XHR sync request with a route handler', { browser: '!webkit' }, () => {
      cy.intercept('http://www.foobar.com:3500/', {
        body: `
          <!DOCTYPE html>
          <html>
          <body>
            <div id="sync_response"></div>
            <div id="async_response"></div>
            <script>
              const xhr = new window.XMLHttpRequest()
              xhr.open('GET', '/fixtures/valid.json', false)
              xhr.send()
              document.querySelector('#sync_response').innerHTML = JSON.stringify(JSON.parse(xhr.responseText))

              const xhr2 = new window.XMLHttpRequest()
              xhr2.open('GET', '/async', true)
              xhr2.onload = () => {
                document.querySelector('#async_response').innerHTML = xhr2.responseText
              }
              xhr2.send()
            </script>
          </body>
          </html>
        `,
      })

      // this intercept won't get hit because the request is sync
      cy.intercept('http://www.foobar.com:3500/fixtures/valid.json', (req) => {
        req.reply({ body: '' })
      })

      // this intercept will get hit because the request is async
      cy.intercept('http://www.foobar.com:3500/async', (req) => {
        req.reply({ body: 'async' })
      }).as('async')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.visit('http://www.foobar.com:3500/')
        cy.get('#sync_response').should('contain', '{"foo":1,"bar":{"baz":"cypress"}}')
        cy.get('#async_response').should('contain', 'async')
      })

      cy.wait('@async')
    })

    it('intercepts a sync XHR request from a Worker with a route handler', () => {
      cy.intercept('/', {
        body: `
          <!DOCTYPE html>
          <html>
          <body>
            <div id="sync_response"></div>
            <div id="async_response"></div>
            <script>
              const workerScript = \`
                const xhr = new XMLHttpRequest()
                xhr.open('GET', 'http://localhost:3500/fixtures/valid.json', false)
                xhr.send()
                postMessage({ type: 'sync', data: JSON.stringify(JSON.parse(xhr.responseText)) })

                const xhr2 = new XMLHttpRequest()
                xhr2.open('GET', 'http://localhost:3500/async', true)
                xhr2.onload = () => {
                  postMessage({ type: 'async', data: xhr2.responseText })
                }
                xhr2.send()
              \`
              const blob = new Blob([workerScript], { type: 'application/javascript' })
              const workerURL = URL.createObjectURL(blob)
              const worker = new Worker(workerURL)
              
              worker.onmessage = (m) => {
                if (m.data.type === 'sync') {
                  document.querySelector('#sync_response').innerHTML = m.data.data
                } else if (m.data.type === 'async') {
                  document.querySelector('#async_response').innerHTML = m.data.data
                }
              }
            </script>
          </body>
          </html>
        `,
      })

      // this intercept will get hit because the sync XHR request is sent from the worker
      cy.intercept('http://localhost:3500/fixtures/valid.json', (req) => {
        req.reply({ body: '{"foo":"bar"}' })
      }).as('sync')

      // this intercept will get hit because the request is async
      cy.intercept('http://localhost:3500/async', (req) => {
        req.reply({ body: 'async' })
      }).as('async')

      cy.visit('/')
      cy.get('#sync_response').should('contain', '{"foo":"bar"}')
      cy.get('#async_response').should('contain', 'async')
      cy.wait('@sync')
      cy.wait('@async')
    })

    context('overrides', function () {
      it('chains middleware with string matcher as expected', function () {
        const e: string[] = []

        cy
        .intercept('/dump-headers*', { middleware: true }, (req) => {
          e.push('mware req handler')
          req.on('before:response', (res) => {
            e.push('mware before:response')
          })

          req.on('response', (res) => {
            e.push('mware response')
          })

          req.on('after:response', (res) => {
            e.push('mware after:response')
          })
        })
        .intercept('/dump-headers*', (req) => {
          e.push('normal req handler')
          req.reply(() => {
            e.push('normal res handler')
          })
        })
        .then(() => {
          return $.get('/dump-headers')
        })
        .wrap(e).should('have.all.members', [
          'mware req handler',
          'normal req handler',
          'mware before:response',
          'normal res handler',
          'mware response',
          'mware after:response',
        ])
      })

      it('chains request handlers from bottom-up', function (done) {
        cy.intercept('/dump-headers*', (req) => {
          req.reply((res) => {
            expect(res.body).to.include('"x-foo":"bar"')
            done()
          })
        })
        .intercept('/dump-headers*', (req) => req.headers['x-foo'] = 'bar')
        .then(() => {
          $.get('/dump-headers')
        })
      })

      /**
       * https://github.com/cypress-io/cypress/issues/9302
       * https://github.com/cypress-io/cypress/discussions/9339
       * https://github.com/cypress-io/cypress/issues/4460
       */
      it('can override a StaticResponse with another StaticResponse', function () {
        const url = uniqueRoute('/items')

        cy.intercept('GET', `${url}*`, [])
        .intercept('GET', `${url}*`, ['foo', 'bar'])
        .then(() => {
          return $.getJSON(url)
        })
        .should('deep.eq', ['foo', 'bar'])
      })

      /**
       * https://github.com/cypress-io/cypress/discussions/9587
       */
      it('can override an interceptor with another interceptor', function () {
        cy.intercept('GET', '**/mydata?**', (req) => {
          throw new Error('this should not be called')
        })
        .intercept('GET', '/mydata*', (req) => {
          req.reply({ body: [1, 2, 3, 4, 5] })
        }).as('mydata')
        .then(() => {
          return $.getJSON('/mydata?abc')
        })
        .should('deep.eq', [1, 2, 3, 4, 5])
        .wait('@mydata')
      })

      it('sends a StaticResponse if the newest stub is a StaticResponse', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, () => {
          throw new Error('this should not be called')
        }).as('interceptor')
        .intercept(`${url}*`, { body: 'something' }).as('staticresponse')
        .intercept(`${url}*`).as('spy')
        .then(() => {
          return $.get(url)
        })
        .should('deep.eq', 'something')
        .wait('@spy')
        .wait('@staticresponse')
        .get('@interceptor.all').should('have.length', 0)
      })

      it('sends a StaticResponse if a request handler does not supply a response', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { body: 'something' }).as('staticresponse')
        .intercept(`${url}*`, () => { }).as('interceptor')
        .then(() => {
          return $.get(url)
        })
        .should('deep.eq', 'something')
        .wait('@interceptor')
        .wait('@staticresponse')
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

      context('response handler chaining', function () {
        it('passes response through in reverse order', function () {
          cy.intercept('/dump-method', function (req) {
            req.on('before:response', (res) => {
              expect(res.body).to.contain('new body')
            })
          }).intercept('/dump-method', function (req) {
            req.on('before:response', (res) => {
              expect(res.body).to.contain('GET')
              res.body = 'new body'
            })
          }).visit('/dump-method')
          .contains('new body')
        })

        it('stops passing response through once res.send called', function () {
          cy.intercept('/dump-method', function (req) {
            req.on('before:response', (res) => {
              throw new Error('this should not have been reached')
            })
          }).intercept('/dump-method', function (req) {
            req.on('before:response', (res) => {
              res.send()
            })
          }).visit('/dump-method').contains('GET')
        })
      })

      // https://github.com/cypress-io/cypress/issues/16292
      describe('multibyte utf8', () => {
        const multibyteUtf8 = [
          // 1. When there's problem in the chunkEnd
          // * 2 bytes
          '12345678901234567890123Ф',
          // * 3 bytes
          '12345678901234567890123안',
          '1234567890123456789012안',
          // * 4 bytes
          '12345678901234567890123😀',
          '1234567890123456789012😀',
          '123456789012345678901😀',
          // 2. When there's a problem in the chunkBegin
          // * 2 bytes
          'dummyФ12345678901234567890123',
          // * 3 bytes
          'dummy안12345678901234567890123',
          'dummy안1234567890123456789012',
          // * 4 bytes
          'dummy😀12345678901234567890123',
          'dummy😀1234567890123456789012',
          'dummy😀123456789012345678901',
        ]

        multibyteUtf8.forEach((str) => {
          it(str, () => {
            cy.intercept('https://example.com/test', {
              body: { result: 'ok' },
            }).as('testRequest')

            cy.window().then(() => {
              let xhr = new XMLHttpRequest()

              xhr.open('POST', 'https://example.com/test')
              xhr.setRequestHeader('Content-Type', 'application/json')
              xhr.send(str)
            })

            cy.wait('@testRequest')
            .its('request')
            .then((req) => {
              expect(req.body).to.eq(str)
            })
          })
        })
      })
    })

    context('logging', function () {
      beforeEach(function () {
        this.logs = []
        cy.on('log:added', (attrs, log) => {
          if (attrs.instrument === 'route') {
            this.lastLog = log

            this.logs.push(log)
          }
        })
      })

      it('has name of route', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(url, {}).then(function () {
          expect(this.lastLog.get('name')).to.eq('route')
        })
      })

      it('uses the wildcard URL', function () {
        cy.intercept('*', {}).then(function () {
          expect(this.lastLog.get('url')).to.eq('*')
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/9403
      // see getDisplayUrlMatcher unit tests for more test cases
      it('stringifies complex matchers', function () {
        cy.intercept({ hostname: 'foo.net', port: 1234 }).then(function () {
          expect(this.lastLog.get('url')).to.eq('{hostname: foo.net, port: 1234}')
          expect(this.lastLog.get('method')).to.eq('*')
        })
      })

      describe('numResponses', function () {
        it('is initially 0', function () {
          cy.intercept(/foo/, {}).then(() => {
            let lastLog

            lastLog = this.lastLog

            expect(lastLog.get('numResponses')).to.eq(0)
          })
        })

        it('is incremented to 2', function () {
          const url = uniqueRoute('/foo')
          const regexUrl = new RegExp(url)

          cy.intercept(regexUrl, {}).then(function () {
            $.get(url)
          }).wrap(this).invoke('lastLog.get', 'numResponses').should('eq', 1)
        })

        it('is incremented for each matching request', function () {
          const url = uniqueRoute('/foo')
          const regexUrl = new RegExp(url)

          cy.intercept(regexUrl, {}).then(function () {
            return Promise.all([$.get(url), $.get(url), $.get(url)])
          }).wrap(this).invoke('lastLog.get', 'numResponses').should('eq', 3)
        })
      })
    })

    context('errors', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          if (log.get('name') !== 'intercept') {
            return
          }

          this.lastLog = log
          this.logs.push(log)
        })
      })

      it('url must be a string or regexp', function (done) {
        testFail((err) => {
          expect(err.message).to.include('`url` must be a string or a regular expression')

          done()
        })

        cy.intercept({
          // @ts-expect-error - deliberately passes an object as the url
          url: {},
        })
      })

      it('requires a url when given a response', function (done) {
        testFail((err) => {
          expect(err.message).to.include('The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        cy.intercept({})
      })

      it('requires arguments', function (done) {
        testFail((err) => {
          expect(err.message).to.include('An invalid RouteMatcher was supplied to `cy.intercept()`. The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        // @ts-expect-error - deliberately calls cy.intercept() without arguments
        cy.intercept()
      })

      it('cannot merge url with url', function (done) {
        const url = uniqueRoute('/bar')

        testFail((err) => {
          expect(err.message).to.include('When invoking \`cy.intercept()\` with a \`RouteMatcher\` as the second parameter, \`url\` can only be specified as the first parameter')

          done()
        })

        // @ts-expect-error - deliberately repeats `url` in the RouteMatcher
        cy.intercept(url, { url }, () => {})
      })

      it('cannot pass RouteMatcherOptions in 2nd arg with no handler', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          expect(err.message).to.include('When invoking \`cy.intercept()\` with a \`RouteMatcher\` as the second parameter, a handler (function or \`StaticResponse\`) must be specified as the third parameter.')

          done()
        })

        // sadly this passes typecheck, but the runtime error will prevent this
        cy.intercept(url, { middleware: true })
      })

      context('with an unexpected number of arguments', function () {
        const url = uniqueRoute('/url')

        it('cy.intercept(url, handler?)', function (done) {
          testFail((err) => {
            expect(err.message).to.include('The `cy.intercept(url, handler?)` signature accepts a maximum of 2 arguments, but 3 arguments were passed.')
            done()
          })

          // @ts-expect-error - deliberately passes both a static response and a handler
          cy.intercept(url, { forceNetworkError: true }, () => {})
        })

        it('cy.intercept(url, mergeRouteMatcher, handler)', function (done) {
          const url = uniqueRoute('/url')

          testFail((err) => {
            expect(err.message).to.include('The `cy.intercept(url, mergeRouteMatcher, handler)` signature accepts a maximum of 3 arguments, but 4 arguments were passed.')
            done()
          })

          // @ts-expect-error - deliberately passes a fourth argument after the static response
          cy.intercept(url, { middleware: true }, { forceNetworkError: true }, () => {})
        })

        it('cy.intercept(method, url, handler?)', function (done) {
          const url = uniqueRoute('/url')

          testFail((err) => {
            expect(err.message).to.include('The `cy.intercept(method, url, handler?)` signature accepts a maximum of 3 arguments, but 4 arguments were passed.')
            done()
          })

          // @ts-expect-error - deliberately passes a fourth argument after the static response
          cy.intercept('POST', url, { forceNetworkError: true }, () => {})
        })
      })

      context('with invalid RouteMatcher', function () {
        it('requires unique header names', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`FOO` was specified more than once in `headers`. Header fields can only be matched once (HTTP header field names are case-insensitive).')

            done()
          })

          cy.intercept({
            headers: {
              foo: 'bar',
              FOO: 'bar',
            },
          })
        })

        // https://github.com/cypress-io/cypress/issues/34975
        ;[
          ['FOO', 'foo'],
          ['Content-Type', 'content-type'],
          ['Foo', 'FOO'],
        ].forEach(([first, second]) => {
          it(`requires unique header names regardless of casing order (${first} and ${second})`, function (done) {
            testFail((err) => {
              expect(err.message).to.include(`\`${second}\` was specified more than once in \`headers\`. Header fields can only be matched once (HTTP header field names are case-insensitive).`)

              done()
            })

            cy.intercept({
              headers: {
                [first]: 'bar',
                [second]: 'bar',
              },
            })
          })
        })

        it('requires StringMatcher header values', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`headers.wrong` must be a string or a regular expression.')

            done()
          })

          cy.intercept({
            headers: {
              good: 'string',
              fine: /regexp/,
              // @ts-expect-error - deliberately passes a number as a header matcher
              wrong: 3,
            },
          })
        })

        it('errors on unknown prop', function (done) {
          testFail((err) => {
            expect(err.message).to.include('An unknown \`RouteMatcher\` property was passed: `wrong`')

            done()
          })

          // @ts-expect-error - deliberately passes an unknown RouteMatcher property
          cy.intercept({ wrong: true })
        })

        it('times must be a positive integer', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`times` must be a positive integer.')
            done()
          })

          cy
          .intercept({ times: 9.75 })
        })

        it('string hostname must be a valid domain name', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`hostname` must be a valid host name or domain name.')
            done()
          })

          cy.intercept({ hostname: 'http://website.web' })
        })

        // https://github.com/cypress-io/cypress/issues/17015
        it('string hostname can be "localhost"', () => {
          cy.intercept({ hostname: 'localhost' })
        })

        it('string hostname can be unicode', () => {
          cy.intercept({ hostname: 'はじめよう.みんな' })
        })
      })

      context('with invalid handler', function () {
        [false, null].forEach(function (handler) {
          const name = String(handler)

          it(`${name} fails`, function (done) {
            testFail((err) => {
              expect(err).to.eq(this.lastLog.get('error'))
              expect(err.message).to.contain(`You passed: ${name}`)

              done()
            })

            // @ts-expect-error - deliberately passes an invalid handler
            cy.intercept('/', handler)
          })
        })
      })

      context('with invalid StaticResponse', function () {
        [
          [
            'forceNetworkError set but not alone',
            {
              forceNetworkError: true,
              body: 'aaa',
            },
            'must be the only option',
          ],
          [
            'statusCode out of range',
            {
              statusCode: -1,
            },
            'must be a number',
          ],
          // @see https://github.com/cypress-io/cypress/issues/33183
          [
            'delay exceeds maximum setTimeout value',
            {
              body: 'test',
              delay: 2147483648,
            },
            'must be less than 2147483648ms',
          ],
        ].forEach(function ([name, handler, expectedErr]) {
          it(`${name} fails`, function (done) {
            testFail((err) => {
              expect(err).to.eq(this.lastLog.get('error'))
              expect(err.message).to.contain(expectedErr)
              expect(err.message).to.contain(`You passed: ${JSON.stringify(handler, null, 2)}`)

              done()
            })

            cy.intercept('/', handler)
          })
        })
      })
    })
  })

  context('unit tests', function () {
    context('#getDisplayUrlMatcher', function () {
      const url = uniqueRoute('/foo')

      function testDisplayUrl (title: string, expectedDisplayUrl: string, matcher: Partial<RouteMatcherOptions>) {
        return it(title, function () {
          expect(getDisplayUrlMatcher(matcher)).to.eq(expectedDisplayUrl)
        })
      }

      testDisplayUrl('with only url', 'http://google.net', { url: 'http://google.net' })
      testDisplayUrl('with url + method', 'http://google.net', { method: 'GET', url: 'http://google.net' })
      testDisplayUrl('with regex url', '/foo/', { url: /foo/ })
      testDisplayUrl('with only path', url, { path: url })
      testDisplayUrl('with only pathname', url, { pathname: url })
      testDisplayUrl('with host + port', '{hostname: foo.net, port: 1234}', { hostname: 'foo.net', port: 1234 })
      testDisplayUrl('with url and query', '{url: http://something, query: {a: b}}', { url: 'http://something', query: { a: 'b' } })
    })
  })
})
