import { getDisplayUrlMatcher } from '@packages/driver/src/cy/net-stubbing/route-matcher-log'
import type { RouteMatcherOptions } from '@packages/net-stubbing/lib/external-types'

const testFail = (cb, expectedDocsUrl = 'https://on.cypress.io/intercept') => {
  cy.on('fail', (err) => {
    // @ts-ignore
    const docsUrl = Array.isArray(err.docsUrl) ? err.docsUrl[0] : err.docsUrl

    expect(docsUrl).to.eq(expectedDocsUrl)
    cb(err)
  })
}

// Due to an issue with requests leaking between tests, we need to ensure that routes are unique from test to test
// See https://github.com/cypress-io/cypress/issues/20397
let routeCount = 0
const uniqueRoute = (route) => {
  routeCount += 1

  return `${route}-${routeCount}`
}

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, sinon, state, Promise } = Cypress

  beforeEach(function () {
    cy.spy(Cypress.utils, 'warning')
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
          // @ts-ignore
          const routeId = _.findKey(state('routes'), { handler })
          const route = state('routes')[routeId!]

          // @ts-ignore
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
          // @ts-ignore
          const routeId = _.findKey(state('routes'), { handler })
          const route = state('routes')[routeId!]

          // @ts-ignore
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

    // @see https://github.com/cypress-io/cypress/issues/16117
    it('can statically stub a url response with headers', () => {
      cy.intercept('/url', { headers: { foo: 'bar' }, body: 'something' })
    })

    // TODO: implement warning in cy.intercept if appropriate
    // https://github.com/cypress-io/cypress/issues/2372
    it.skip('warns if a percent-encoded URL is used', function () {
      cy.intercept('GET', '/foo%25bar').then(function () {
        expect(Cypress.utils.warning).to.be.calledWith('A URL with percent-encoded characters was passed to cy.intercept(), but cy.intercept() expects a decoded URL.\n\nDid you mean to pass "/foo%bar"?')
      })
    })

    // NOTE: see todo on 'warns if a percent-encoded URL is used'
    it.skip('does not warn if an invalid percent-encoded URL is used', function () {
      cy.intercept('GET', 'http://example.com/%E0%A4%A').then(function () {
        expect(Cypress.utils.warning).to.not.be.called
      })
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
          // @ts-ignore
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

        // @ts-ignore: should fail
        cy.intercept({
          // @ts-ignore
          url: {},
        })
      })

      // TODO: not currently implemented
      it.skip('fails when method is invalid', function (done) {
        const url = uniqueRoute('/foo')

        testFail((err) => {
          expect(err.message).to.include('cy.intercept() was called with an invalid method: \'POSTS\'.')

          done()
        })

        cy.intercept('post', url, {})
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

        // @ts-ignore - should fail
        cy.intercept()
      })

      it('cannot merge url with url', function (done) {
        const url = uniqueRoute('/bar')

        testFail((err) => {
          expect(err.message).to.include('When invoking \`cy.intercept()\` with a \`RouteMatcher\` as the second parameter, \`url\` can only be specified as the first parameter')

          done()
        })

        // @ts-ignore - should fail
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

          // @ts-ignore
          cy.intercept(url, { forceNetworkError: true }, () => {})
        })

        it('cy.intercept(url, mergeRouteMatcher, handler)', function (done) {
          const url = uniqueRoute('/url')

          testFail((err) => {
            expect(err.message).to.include('The `cy.intercept(url, mergeRouteMatcher, handler)` signature accepts a maximum of 3 arguments, but 4 arguments were passed.')
            done()
          })

          // @ts-ignore
          cy.intercept(url, { middleware: true }, { forceNetworkError: true }, () => {})
        })

        it('cy.intercept(method, url, handler?)', function (done) {
          const url = uniqueRoute('/url')

          testFail((err) => {
            expect(err.message).to.include('The `cy.intercept(method, url, handler?)` signature accepts a maximum of 3 arguments, but 4 arguments were passed.')
            done()
          })

          // @ts-ignore
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

        it('requires StringMatcher header values', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`headers.wrong` must be a string or a regular expression.')

            done()
          })

          // @ts-ignore this is invalid on purpose
          cy.intercept({
            headers: {
              good: 'string',
              fine: /regexp/,
              // @ts-ignore
              wrong: 3,
            },
          })
        })

        it('errors on matchUrlAgainstPath usage', function (done) {
          testFail((err) => {
            expect(err.message).to.include('`matchUrlAgainstPath` was removed in Cypress 7.0.0')

            done()
          })

          // @ts-ignore
          cy.intercept({ matchUrlAgainstPath: true })
        })

        it('errors on unknown prop', function (done) {
          testFail((err) => {
            expect(err.message).to.include('An unknown \`RouteMatcher\` property was passed: `wrong`')

            done()
          })

          // @ts-ignore
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

            // @ts-ignore - this should error
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
        ].forEach(function ([name, handler, expectedErr]) {
          it(`${name} fails`, function (done) {
            testFail((err) => {
              expect(err).to.eq(this.lastLog.get('error'))
              expect(err.message).to.contain(expectedErr)
              expect(err.message).to.contain(`You passed: ${JSON.stringify(handler, null, 2)}`)

              done()
            })

            // @ts-ignore - this should error
            cy.intercept('/', handler)
          })
        })
      })
    })
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
      const url4 = 'http://localhost:3501/fixtures/generic.html'
      const url3 = `http://localhost:3501/redirect?href=${encodeURIComponent(url4)}`
      const url2 = `http://foobar.com:3500/redirect?chunked=1&href=${encodeURIComponent(url3)}`
      const url1 = `http://foobar.com:3500/redirect?chunked=1&href=${encodeURIComponent(url2)}`

      cy.visit(url1)
      .location('href').should('eq', url4)
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
      // using "hosts" setting in the "cypress.json" file
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
          let headers = res.response?.headers

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
          let headers = res.response?.headers

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
          let headers = res.response?.headers

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
          let headers = res.response?.headers

          expect(headers!['access-control-expose-headers']).to.eq('x-token')
          expect(headers!['x-token']).to.eq('token')
        })
      })
    })
  })

  context('stubbing with static responses', function () {
    it('can stub a response with static body as string', function (done) {
      cy.intercept({
        url: '*',
      }, 'hello world').then(() => {
        $.get('/abc123').done((responseText, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseText).to.eq('hello world')

          done()
        })
      })
    })

    it('can stub a cy.visit with static body', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(url, '<html>hello cruel world</html>').visit(url).document().should('contain.text', 'hello cruel world')
    })

    it('can stub a response with an empty StaticResponse', function (done) {
      cy.intercept('/*', {}).then(() => {
        $.get('/').done((responseText, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseText).to.eq('')

          done()
        })
      })
    })

    // TODO(webkit): fix forceNetworkError https://github.com/cypress-io/cypress/issues/23810
    it('can stub a response with a network error', { browser: '!webkit' }, function (done) {
      cy.intercept('/*', {
        forceNetworkError: true,
      }).then(() => {
        $.get('/').fail((xhr) => {
          expect(xhr.statusText).to.eq('error')
          expect(xhr.status).to.eq(0)

          done()
        })
      })
    })

    it('can use regular strings as response', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'foo bar baz').as('getFoo').then(function (win) {
        $.get(url)
      }).wait('@getFoo').then(function (res) {
        expect(res.response!.body).to.eq('foo bar baz')
      })
    })

    it('can stub requests with uncommon HTTP methods', function () {
      const url = uniqueRoute('/foo')

      cy.intercept('PROPFIND', url, 'foo bar baz').as('getFoo').then(function (win) {
        $.ajax({
          url,
          method: 'PROPFIND',
        })
      }).wait('@getFoo').then(function (res) {
        expect(res.response!.body).to.eq('foo bar baz')
      })
    })

    it('can stub a response with an array', function (done) {
      const response = ['foo', 'bar', { foo: 'baz' }]

      cy.intercept({
        url: '*',
      }, response).then(() => {
        $.get('/abc123').done((responseJson, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseJson).to.deep.eq(response)
          expect(xhr.getResponseHeader('content-type')).to.eq('application/json')

          done()
        })
      })
    })

    it('does not drop falsy static responses', function (done) {
      cy.intercept({
        url: '*',
      }, { body: false }).then(() => {
        $.get('/abc123').done((responseText, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseText).to.eq(false)
          done()
        })
      })
    })

    it('still works after a cy.visit', function () {
      const url = uniqueRoute('/foo')
      const regexUrl = new RegExp(url)

      cy.intercept(regexUrl, {
        body: JSON.stringify({ foo: 'bar' }),
        headers: {
          'content-type': 'application/json',
        },
      }).as('getFoo').visit('http://localhost:3500/fixtures/jquery.html').window().then(function (win) {
        return new Promise(function (resolve) {
          $.get(url).done(_.ary(resolve, 0))
        })
      }).wait('@getFoo').its('request.url').should('include', url).visit('http://localhost:3500/fixtures/generic.html').window().then(function (win) {
        return new Promise(function (resolve) {
          $.get(url).done(_.ary(resolve, 0))
        })
      }).wait('@getFoo').its('request.url').should('include', url)
    })

    // @see https://github.com/cypress-io/cypress/issues/15841
    it('prevents requests from reaching destination server', function () {
      cy.visit('/fixtures/empty.html')

      const v = String(Date.now())

      // this test creates server-side state via /set-var to test if requests are being sent or not
      cy.then(async () => {
        await $.get(`/set-var?v=${v}`)
        expect(await $.get('/get-var')).to.eq(v)
      })
      .intercept('/set-var*', { statusCode: 200, body: 'else' })
      .then(async () => {
        await $.get(`/set-var?v=something`)
        expect(await $.get('/get-var')).to.eq(v)
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8532
    context('can stub a response with an empty array', function () {
      const assertEmptyArray = (done) => {
        return () => {
          $.get('/abc123').done((responseJson, _, xhr) => {
            expect(xhr.status).to.eq(200)
            expect(responseJson).to.deep.eq([])
            expect(xhr.getResponseHeader('content-type')).to.eq('application/json')

            done()
          })
        }
      }

      it('with explicit StaticResponse', function (done) {
        cy.intercept({
          url: '*',
        }, {
          body: [],
        }).then(assertEmptyArray(done))
      })

      it('with body shorthand', function (done) {
        cy.intercept('*', []).then(assertEmptyArray(done))
      })

      it('with method, url, res shorthand', function (done) {
        cy.intercept('GET', '*', []).then(assertEmptyArray(done))
      })

      it('in req.reply', function (done) {
        cy.intercept('*', (req) => req.reply([])).then(assertEmptyArray(done))
      })

      it('in res.send', function (done) {
        cy.intercept('*', (req) => req.reply((res) => res.send(200, []))).then(assertEmptyArray(done))
      })
    })

    context('fixtures', function () {
      it('can stub a response with a JSON object', function () {
        cy.intercept({
          method: 'POST',
          url: '/test-xhr',
        }, {
          fixture: 'valid.json',
        }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

        cy.contains('#result', '{"foo":1,"bar":{"baz":"cypress"}}').should('be.visible')
      })

      it('works with content-type override', function () {
        cy.intercept({
          method: 'POST',
          url: '/test-xhr',
        }, {
          headers: {
            'content-type': 'text/plain',
          },
          fixture: 'valid.json',
        }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

        cy.contains('#result', '"{\\"foo\\":1,\\"bar\\":{\\"baz\\":\\"cypress\\"}}"').should('be.visible')
      })

      it('works if the JSON file has null content', function () {
        cy.intercept({
          method: 'POST',
          url: '/test-xhr',
        }, {
          fixture: 'null.json',
        }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

        cy.contains('#result', '""').should('be.visible')
      })

      // @see https://github.com/cypress-io/cypress/issues/19330
      // @see https://github.com/cypress-io/cypress/issues/19344
      it('load fixture as Buffer when encoding is null', function () {
        cy.spy(Cypress, 'backend').log(false)

        cy.intercept('/fixtures/media/small.mp4', {
          fixture: 'media/small.mp4,null',
        }).as('video')

        cy.visit('/fixtures/video.html')
        .then(() => {
          expect(Cypress.backend).to.be.calledWithMatch(
            'net',
            'route:added',
            {
              staticResponse: {
                fixture: {
                  filePath: 'media/small.mp4',
                  encoding: null,
                },
              },
            },
          )
        })
      })

      it('load fixture with specified encoding', function () {
        cy.spy(Cypress, 'backend').log(false)

        cy.intercept('non-existing-image.png', {
          headers: { 'content-type': 'image/jpeg' },
          fixture: 'media/cypress.png,base64',
        }).as('video')

        cy.visit('/fixtures/img-embed.html')
        .then(() => {
          expect(Cypress.backend).to.be.calledWithMatch(
            'net',
            'route:added',
            {
              staticResponse: {
                fixture: {
                  filePath: 'media/cypress.png',
                  encoding: 'base64',
                },
              },
            },
          )
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/8623
      it('works with images', function () {
        cy.visit('/fixtures/img-embed.html')
        .contains('div', 'error loading image')
        .intercept('non-existing-image.png', { fixture: 'media/cypress.png' })
        .reload()
        .contains('div', 'it loaded')
      })

      // @see https://github.com/cypress-io/cypress/issues/15898
      // @see https://github.com/cypress-io/cypress/issues/16223
      it('works when uploading a binary file', function () {
        cy.fixture('media/cypress.png').as('image')
        cy.intercept('POST', '/upload').as('upload')

        cy.window().then((win) => {
          const blob = Cypress.Blob.base64StringToBlob(this.image, 'image/png')
          const xhr = new win.XMLHttpRequest()
          const formData = new win.FormData()

          formData.append('file', blob)
          xhr.open('POST', '/upload', true)
          xhr.send(formData)
        })

        cy.wait('@upload')
      })

      it('can stub a response with an ArrayBuffer', function () {
        const stub = new Uint8Array(2)

        stub[0] = 35
        stub[1] = 2
        const assertBody = (body: ArrayBuffer) => {
          const uint8 = new Uint8Array(body)

          stub.forEach((value, index) => {
            expect(uint8[index]).to.eq(value)
          })
        }

        cy.intercept('/binary*', {
          body: stub.buffer,
          headers: {
            'content-type': 'application/octet-stream',
          },
          statusCode: 200,
        }).as('get')
        .visit('/fixtures/display-binary.html')
        .wait('@get').its('response.body').should(assertBody)
        .get('#result').should('have.text', stub.join(', '))
      })
    })
  })

  context('intercepting request', function () {
    it('receives the original request in handler', function (done) {
      cy.intercept('/def456*', function (req) {
        req.reply({
          statusCode: 404,
        })

        expect(req).to.include({
          method: 'GET',
          httpVersion: '1.1',
        })

        expect(req.url).to.match(/^http:\/\/localhost:3500\/def456/)

        done()
      }).then(function () {
        $.get('/def456')
      })
    })

    it('receives the original request body in handler', function (done) {
      cy.intercept('/aaa', function (req) {
        expect(req.body).to.eq('foo-bar-baz')

        done()
      }).then(function () {
        $.post('/aaa', 'foo-bar-baz')
      })
    })

    it('can modify an ArrayBuffer request body', function () {
      const modifiedUint8 = new Uint8Array(2)

      modifiedUint8[0] = 35
      modifiedUint8[1] = 2
      const assertBody = (body: ArrayBuffer) => {
        const uint8 = new Uint8Array(body)

        modifiedUint8.forEach((value, index) => {
          expect(uint8[index]).to.eq(value)
        })
      }

      cy.intercept('/binary*', function (req) {
        req.body = modifiedUint8.buffer
      }).as('post')
      .visit('/fixtures/dump-binary.html')
      .wait('@post').its('response.body').should(assertBody)
      .get('#result').should('have.text', modifiedUint8.join(', '))
    })

    it('can modify original request body and have it passed to next handler', function (done) {
      cy.intercept('/post-only', function (req) {
        expect(req.body).to.eq('quuz')
        done()
      }).intercept('/post-only', function (req) {
        expect(req.body).to.eq('quux')
        req.body = 'quuz'
      }).intercept('/post-only', function (req) {
        expect(req.body).to.eq('foo-bar-baz')
        req.body = 'quux'
      }).then(function () {
        $.post('/post-only', 'foo-bar-baz')
      })
    })

    it('can modify a cy.visit before it goes out', function () {
      cy.intercept('/dump-headers', function (req) {
        expect(req.headers['foo']).to.eq('bar')

        req.headers['foo'] = 'quux'
      }).then(function () {
        cy.visit({
          url: '/dump-headers',
          headers: {
            'foo': 'bar',
          },
        })

        cy.get('body').should('contain.text', '"foo":"quux"')
      })
    })

    it('can modify the request URL and headers', function (done) {
      cy.intercept('/does-not-exist', function (req) {
        expect(req.headers['foo']).to.eq('bar')
        req.url = 'http://localhost:3500/dump-headers'

        req.headers['foo'] = 'quux'
      }).then(function () {
        const xhr = new XMLHttpRequest()

        xhr.open('GET', '/does-not-exist')
        xhr.setRequestHeader('foo', 'bar')
        xhr.send()

        xhr.onload = () => {
          expect(xhr.responseText).to.contain('"foo":"quux"')

          done()
        }
      })
    })

    it('can delete a request header', function () {
      cy.intercept('/dump-headers*', function (req) {
        expect(req.headers).to.include({ 'foo': 'bar' })
        delete req.headers['foo']
      }).as('get')
      .then(() => {
        return $.get({
          url: '/dump-headers',
          headers: {
            'foo': 'bar',
          },
        })
      })
      .should('not.include', 'foo')
      .wait('@get')
    })

    it('can modify the request method', function (done) {
      cy.intercept('/dump-method', function (req) {
        expect(req.method).to.eq('POST')

        req.method = 'PATCH'
      }).then(function () {
        $.post('/dump-method').done((responseText) => {
          expect(responseText).to.contain('request method: PATCH')

          done()
        })
      })
    })

    it('can modify the request body', function (done) {
      const body = '{"foo":"bar"}'

      cy.intercept('/post-only', function (req) {
        expect(req.body).to.eq('quuz')
        req.headers['content-type'] = 'application/json'

        req.body = body
      }).then(function () {
        $.post('/post-only', 'quuz').done((responseText) => {
          expect(responseText).to.contain(body)

          done()
        })
      })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23422
    it('can add a body to a request that does not have one', { retries: 15 }, function (done) {
      const body = '{"foo":"bar"}'

      cy.intercept('/post-only*', function (req) {
        expect(req.body).to.eq('')
        expect(req.method).to.eq('GET')
        req.method = 'POST'
        req.headers['content-type'] = 'application/json'

        req.body = body
      }).then(function () {
        $.get('/post-only').then((responseText) => {
          expect(responseText).to.contain(body)
          done()
        })
      })
    })

    it('can reply with a JSON fixture', function () {
      cy.intercept({
        method: 'POST',
        url: '/test-xhr',
      }, (req) => {
        req.reply({
          fixture: 'valid.json',
        })
      }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

      cy.contains('{"foo":1,"bar":{"baz":"cypress"}}')
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23303
    it('can delay and throttle a StaticResponse', { retries: 15 }, function (done) {
      const payload = 'A'.repeat(10 * 1024)
      const throttleKbps = 10
      const delay = 250
      const expectedSeconds = payload.length / (1024 * throttleKbps) + delay / 1000

      cy.intercept('/timeout*', (req) => {
        this.start = Date.now()

        req.reply({
          statusCode: 200,
          body: payload,
          throttleKbps,
          delay,
        })
      }).then(() => {
        return $.get('/timeout').then((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000 + 100, 100)
          expect(responseText).to.eq(payload)

          done()
        })
      })
    })

    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23404
    it('can delay with deprecated delayMs param', { retries: 15 }, function () {
      const delayMs = 250

      cy.intercept('/timeout*', (req) => {
        this.start = Date.now()

        req.reply({
          delayMs,
        })
      }).then(() => {
        return $.get('/timeout').then((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(delayMs + 100, 100)
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/14446
    // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23406
    it('should delay the same amount on every response', { retries: 15 }, () => {
      const delay = 250

      const testDelay = () => {
        const start = Date.now()

        return $.get('/timeout').then((responseText) => {
          expect(Date.now() - start).to.be.closeTo(delay + 100, 100)
          expect(responseText).to.eq('foo')
        })
      }

      cy.intercept('/timeout*', {
        statusCode: 200,
        body: 'foo',
        delay,
      }).as('get')
      .then(() => testDelay()).wait('@get')
      .then(() => testDelay()).wait('@get')
      .then(() => testDelay()).wait('@get')
    })

    // https://github.com/cypress-io/cypress/issues/15188
    it('delay works correctly with 204 No Content', (done) => {
      cy.on('fail', (err) => {
        expect(err.message).to.include('No response ever occurred')

        done()
      })

      cy.intercept('POST', '/post-only', {
        statusCode: 204, // delay is not respected
        delay: 5000,
      }).as('create')

      cy.then(() => {
        fetch('/post-only', {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
        })
      })

      cy.wait('@create', { timeout: 500 })
    })

    // @see https://github.com/cypress-io/cypress/issues/15901
    it('can intercept utf-8 request bodies without crashing', function () {
      cy.intercept('POST', 'http://localhost:5000/api/sample')
      cy.visit('/fixtures/utf8-post.html')
    })

    // https://github.com/cypress-io/cypress/issues/16327
    context('request url querystring', () => {
      // In the code below, cy.window() is used instead of $.get.
      // It's because XHR is not sent on Firefox and it's flaky on Chrome.
      it('parse query correctly', () => {
        cy.intercept({ url: '/users*' }, (req) => {
          // Assert that query attributes are available in `intercept` callback
          expect(req.query.someKey).to.deep.equal('someValue')
          expect(req.query).to.deep.equal({ someKey: 'someValue' })
        }).as('getUrl')

        cy.window().then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('GET', '/users?someKey=someValue')
          xhr.send()
        })

        cy.wait('@getUrl')
        .then((interception) => {
          // Assert that query attributes are maintained once interception is yielded
          expect(interception.request.query.someKey).to.deep.equal('someValue')
          expect(interception.request.query).to.deep.equal({ someKey: 'someValue' })
        })
      })

      context('reconcile changes', () => {
        it('by assigning a new query parameter obj', () => {
          cy.intercept({ url: '/users*' }, (req) => {
            req.query = {
              a: 'b',
            }

            expect(req.url).to.eq('http://localhost:3500/users?a=b')
          }).as('getUrl')

          cy.window().then((win) => {
            const xhr = new win.XMLHttpRequest()

            xhr.open('GET', '/users?someKey=someValue')
            xhr.send()
          })

          cy.wait('@getUrl')
        })

        it('by setting new properties', () => {
          cy.intercept({ url: '/users*' }, (req) => {
            expect(req.query.a).to.eq('b')
            req.query.c = 'd'

            expect(req.url).to.eq('http://localhost:3500/users?a=b&c=d')
          }).as('getUrl')

          cy.window().then((win) => {
            const xhr = new win.XMLHttpRequest()

            xhr.open('GET', '/users?a=b')
            xhr.send()
          })

          cy.wait('@getUrl')
        })

        // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23407
        it('by doing both', { retries: 15 }, () => {
          cy.intercept({ url: '/users*' }, (req) => {
            req.query = {
              a: 'b',
            }

            expect(req.query.a).to.eq('b')
            req.query.c = 'd'

            expect(req.url).to.eq('http://localhost:3500/users?a=b&c=d')
          }).as('getUrl')

          cy.window().then((win) => {
            const xhr = new win.XMLHttpRequest()

            xhr.open('GET', '/users?someKey=someValue')
            xhr.send()
          })

          cy.wait('@getUrl')
        })

        // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23414
        it('by deleting query member', { retries: 15 }, () => {
          cy.intercept({ url: '/users*' }, (req) => {
            req.query = {
              a: 'b',
              c: 'd',
            }

            delete req.query.c

            expect(req.url).to.eq('http://localhost:3500/users?a=b')
          }).as('getUrl')

          cy.window().then((win) => {
            const xhr = new win.XMLHttpRequest()

            xhr.open('GET', '/users?someKey=someValue')
            xhr.send()
          })

          cy.wait('@getUrl')
        })

        context('by setting new url', () => {
          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23415
          it('absolute path', { retries: 15 }, () => {
            cy.intercept({ url: '/users*' }, (req) => {
              req.url = 'http://localhost:3500/users?a=b'

              expect(req.query).to.deep.eq({ a: 'b' })
            }).as('getUrl')

            cy.window().then((win) => {
              const xhr = new win.XMLHttpRequest()

              xhr.open('GET', '/users?someKey=someValue')
              xhr.send()
            })

            cy.wait('@getUrl')
          })

          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23433
          it('relative path', { retries: 15 }, () => {
            cy.intercept({ url: '/users*' }, (req) => {
              req.url = '/users?a=b'

              expect(req.query).to.deep.eq({ a: 'b' })
              expect(req.url).to.eq('http://localhost:3500/users?a=b')
            }).as('getUrl')

            cy.window().then((win) => {
              const xhr = new win.XMLHttpRequest()

              xhr.open('GET', '/users?someKey=someValue')
              xhr.send()
            })

            cy.wait('@getUrl')
          })

          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23434
          it('empty string', { retries: 15 }, () => {
            cy.intercept({ url: '/users*' }, (req) => {
              req.url = ''

              expect(req.query).to.deep.eq({})
            }).as('getUrl')

            cy.window().then((win) => {
              const xhr = new win.XMLHttpRequest()

              xhr.open('GET', '/users?someKey=someValue')
              xhr.send()
            })

            cy.wait('@getUrl')
          })
        })

        context('throwing errors correctly', () => {
          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23423
          it('defineproperty', { retries: 15 }, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.eq('`defineProperty()` is not allowed.')

              done()
            })

            cy.intercept({ url: '/users*' }, (req) => {
              Object.defineProperty(req.query, 'key', {
                enumerable: false,
                configurable: false,
                writable: false,
                value: 'static',
              })

              expect(req.query).to.deep.eq({})
            }).as('getUrl')

            cy.window().then((win) => {
              const xhr = new win.XMLHttpRequest()

              xhr.open('GET', '/users?someKey=someValue')
              xhr.send()
            })

            cy.wait('@getUrl')
          })

          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23147
          it('setPrototypeOf', { retries: 15 }, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.eq('`setPrototypeOf()` is not allowed.')

              done()
            })

            cy.intercept({ url: '/users*' }, (req) => {
              Object.setPrototypeOf(req.query, null)

              expect(req.query).to.deep.eq({})
            }).as('getUrl')

            cy.window().then((win) => {
              const xhr = new win.XMLHttpRequest()

              xhr.open('GET', '/users?someKey=someValue')
              xhr.send()
            })

            cy.wait('@getUrl')
          })
        })
      })
    })

    context('request events', function () {
      context('can end response', () => {
        for (const eventName of ['before:response', 'response']) {
          // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23434
          it(`in \`${eventName}\``, { retries: 15 }, () => {
            const url = uniqueRoute('/foo')
            const expectBeforeResponse = eventName === 'response'
            let beforeResponseCalled = false

            cy.intercept(`${url}*`, (req) => {
              req.on('response', (res) => {
                throw new Error('response should not be reached')
              })

              req.on('before:response', (res) => {
                beforeResponseCalled = true

                if (!expectBeforeResponse) {
                  throw new Error('before:response should not be reached')
                }
              })
            }).as('first')
            .intercept(`${url}*`, (req) => {
              // @ts-ignore
              req.on(eventName, (res) => {
                res.headers['content-type'] = 'application/json'
                res.send({
                  statusCode: 200,
                  fixture: 'valid.json',
                })
              })
            }).as('second')
            .then(() => {
              return $.getJSON(url)
            })
            .should('include', { 'foo': 1 })
            .wait('@first').wait('@second')
            .then(() => {
              expect(beforeResponseCalled).to.eq(expectBeforeResponse)
            })
          })
        }
      })

      context('errors', function () {
        it('when unknown eventName is passed', function (done) {
          const url = uniqueRoute('/foo')

          testFail((err) => {
            expect(err.message).to.contain('An invalid event name was passed as the first parameter to \`req.on()\`.')
            done()
          })

          cy.intercept(url, function (req) {
            // @ts-ignore
            req.on('totally-bad', _.noop)
          }).visit(url)
        })

        it('when no function is passed', function (done) {
          const url = uniqueRoute('/foo')

          testFail((err) => {
            expect(err.message).to.contain('\`req.on()\` requires the second parameter to be a function.')
            done()
          })

          cy.intercept(url, function (req) {
            // @ts-ignore
            req.on('before:response', false)
          }).visit(url)
        })
      })
    })

    context('body parsing', function () {
      [
        ['application/json', '{"foo":"bar"}'],
        ['application/vnd.api+json', '{}'],
      ].forEach(([contentType, expectedBody]) => {
        it(`automatically parses ${contentType} request bodies`, function () {
          const p = Promise.defer()

          cy.intercept('/post-only', (req) => {
            expect(req.headers['content-type']).to.eq(contentType)
            expect(req.body).to.deep.eq({ foo: 'bar' })

            p.resolve()
          }).as('post')
          .then(() => {
            return $.ajax({
              url: '/post-only',
              method: 'POST',
              contentType,
              data: JSON.stringify({ foo: 'bar' }),
            })
          }).then((responseText) => {
            expect(responseText).to.include(`request body:<br>${expectedBody}`)

            return p
          })
          .wait('@post').its('request.body').should('deep.eq', { foo: 'bar' })
        })
      })

      it('doesn\'t automatically parse JSON request bodies if content-type is wrong', function () {
        const p = Promise.defer()

        cy.intercept('/post-only', (req) => {
          expect(req.body).to.deep.eq(JSON.stringify({ foo: 'bar' }))

          p.resolve()
        }).as('post')
        .then(() => {
          return $.ajax({
            url: '/post-only',
            method: 'POST',
            contentType: 'text/html',
            data: JSON.stringify({ foo: 'bar' }),
          })
        }).wrap(p)
        .wait('@post').its('request.body').should('eq', JSON.stringify({ foo: 'bar' }))
      })

      it('sets body to string if JSON is malformed', function () {
        const p = Promise.defer()

        cy.intercept('/post-only*', (req) => {
          expect(req.body).to.deep.eq('{ foo::: }')

          p.resolve()
        }).as('post')
        .then(() => {
          return $.ajax({
            url: '/post-only',
            method: 'POST',
            contentType: 'application/json',
            // invalid JSON
            data: '{ foo::: }',
          }).catch(() => p)
        })
        .wait('@post').its('request.body').should('deep.eq', '{ foo::: }')
      })
    })

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

      // TODO(webkit): fix forceNetworkError https://github.com/cypress-io/cypress/issues/23810
      it('can forceNetworkError', { browser: '!webkit' }, function (done) {
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
          expect(req.headers['content-length']).to.eq('0')

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
          const expectedStatusCode = [200, 304][hits]

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

      // TODO(webkit): fix forceNetworkError https://github.com/cypress-io/cypress/issues/23810
      it('can forceNetworkError', { browser: '!webkit' }, function (done) {
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
          $.get('http://localhost:3333/should-err')
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
            $.get('http://localhost:3333/should-err')
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

  context('waiting and aliasing', { defaultCommandTimeout: 10000 }, function () {
    const testFailWaiting = (cb) => testFail(cb, 'https://on.cypress.io/wait')

    it('can wait on a single response using "alias"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
    })

    it('can timeout waiting on a single response using "alias"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can wait on a single response using "alias.response"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.response')
    })

    it('can timeout waiting on a single response using "alias.response"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.response', { timeout: 100 })
    })

    it('can wait on a single request using "alias.request"', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`)
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
    })

    it('can timeout waiting on a single request using "alias.request"', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('No request ever occurred.')
        done()
      })

      cy.intercept(`${url}*`)
      .as('foo.bar')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can incrementally wait on responses', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, 'bar')
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar')
    })

    it('can timeout incrementally waiting on responses', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('for the 1st response to the route')
        done()
      })

      cy.intercept(`${url}*`, () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get(url)
        $.get(url)
      })
      .wait('@foo.bar', { timeout: 500 })
      .wait('@foo.bar', { timeout: 500 })
    })

    it('can incrementally wait on requests', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
    })

    it('can timeout incrementally waiting on requests', function (done) {
      const url = uniqueRoute('/foo')

      testFailWaiting((err) => {
        expect(err.message).to.contain('for the 2nd request to the route')
        done()
      })

      cy.intercept(`${url}*`, (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get(url)
      })
      .wait('@foo.bar.request')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can alias a route without stubbing it', function () {
      cy.intercept(/fixtures\/app/).as('getFoo').then(function () {
        $.get('/fixtures/app.json')
      }).wait('@getFoo').then(function (res) {
        const log = cy.queue.logs({
          displayName: 'xhr',
        })[0]

        expect(log.get('alias')).to.eq('getFoo')

        expect(res.response!.body).to.deep.eq({
          some: 'json',
          foo: {
            bar: 'baz',
          },
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8999
    it('can spy on a 204 no body response', function () {
      cy.intercept('/status-code*').as('status')
      .then(() => {
        $.get('/status-code?code=204')
      })
      .wait('@status').its('response.statusCode').should('eq', 204)
    })

    // @see https://github.com/cypress-io/cypress/issues/8934
    // TODO(webkit): fix+unskip. currently fails in WK because cache is disabled
    it('can spy on a 304 not modified image response', { browser: '!webkit' }, function () {
      const url = `/fixtures/media/cypress.png?i=${Date.now()}`

      cy.intercept(url).as('image')
      .then(() => {
        $.get({ url, cache: true })
      })
      .then(() => {
        if (Cypress.isBrowser('firefox')) {
          // strangely, Firefox requires some time to be waited before the first image response will be cached
          cy.wait(1000)
        }
      })
      .then(() => {
        $.get({ url, cache: true })
      })
      .wait('@image').its('response.statusCode').should('eq', 200)
      .wait('@image').its('response.statusCode').should('eq', 304)
    })

    // https://github.com/cypress-io/cypress/issues/14522
    it('different aliases are used for the same url', () => {
      cy.intercept('/status-code*').as('status')
      .then(() => {
        $.get('/status-code?code=204')
      })
      .wait('@status').its('response.statusCode').should('eq', 204)

      cy.intercept('/status-code*').as('status2')
      .then(() => {
        $.get('/status-code?code=301')
      })
      .wait('@status').its('response.statusCode').should('eq', 301)
      .wait('@status2').its('response.statusCode').should('eq', 301)
    })

    context('abort and cancel', () => {
      // https://github.com/cypress-io/cypress/issues/9549
      it('should handle aborted requests', () => {
        cy.intercept('https://jsonplaceholder.cypress.io/todos/1').as('xhr')
        cy.visit('fixtures/xhr-abort.html')
        cy.get('#btn').click()
        cy.get('pre').contains('delectus') // response body renders to page
        cy.wait('@xhr')
      })

      it('stops waiting when an xhr request is canceled', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.intercept('POST', /users/, {
          body: { name: 'b' },
          delay: 2000,
        }).as('createUser')

        cy.window()
        .then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('POST', '/users/')

          xhr.send()

          win.location.reload()

          cy.wait('@createUser').its('state').should('eq', 'Errored')
        })
      })

      it('stops waiting when an fetch request is canceled', () => {
        cy.visit('http://localhost:3500/fixtures/generic.html')

        cy.intercept('POST', /users/, {
          body: { name: 'b' },
          delay: 2000,
        }).as('createUser')

        cy.window()
        .then((win) => {
          const controller = new AbortController()
          const { signal } = controller

          fetch('/users/', { signal, method: 'POST' }).catch((e) => {
          // do nothing on an abort
          })

          // if you abort too fast in firefox or safari, the fetch is never sent to the server for us to intercept
          if (!Cypress.isBrowser({ family: 'chromium' })) {
            setTimeout(() => {
              controller.abort()
            }, 100)
          } else {
            controller.abort()
          }

          cy.wait('@createUser').its('state').should('eq', 'Errored')
        })
      })
    })

    // TODO(webkit): fix forceNetworkError https://github.com/cypress-io/cypress/issues/23810
    // @see https://github.com/cypress-io/cypress/issues/9062
    it('can spy on a request using forceNetworkError', { browser: '!webkit' }, function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, { forceNetworkError: true })
      .as('err')
      .then(() => {
        $.get(url)
      })
      .wait('@err').should('have.property', 'error')
      .and('include', {
        message: 'forceNetworkError called',
        name: 'Error',
      })
      .get('@err').should('not.have.property', 'response')
    })

    // @see https://github.com/cypress-io/cypress/issues/15823
    it('can override an alias using .as', function () {
      cy.intercept('/users*').as('getUsers')
      cy.intercept('/users*', { body: { data: 'fake data' }, statusCode: 200 }).as('getUsers')
      .then(() => {
        $.get('/users')
      })
      .wait('@getUsers')
    })

    // @see https://github.com/cypress-io/cypress/issues/16451
    it('yields the expected interception when two requests are raced', function () {
      const url = uniqueRoute('/foo')

      cy.intercept(`${url}*`, { times: 1 }, { delay: 100, body: 'bar' }).as('a')
      cy.intercept(`${url}*`, { times: 1 }, 'foo').as('a')
      cy.then(() => {
        $.get(url)
        $.get(url)
      })
      .wait('@a').its('response.body').should('eq', 'foo')
      .wait('@a').its('response.body').should('eq', 'bar')
    })

    // @see https://github.com/cypress-io/cypress/issues/9306
    context('cy.get(alias)', function () {
      it('gets the latest Interception by alias', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias').then((interception) => {
          cy.get('@alias').then((interception2) => {
            expect(interception).to.not.be.null
            expect(interception).to.eq(interception2)
          })
        })
      })

      it('gets all aliased Interceptions by alias.all', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias')

        cy.get('@alias.all').then((interceptions) => {
          expect(interceptions).to.have.length(2)
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/25448
      it('gets all aliased Interceptions by alias.all when assigning an alias using req.alias', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'alias'
          req.reply({ bar: 'baz' })
        })
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').wait('@alias')

        cy.get('@alias.all').then((interceptions) => {
          expect(interceptions).to.have.length(2)
        })
      })

      // TODO: fix+document this behavior
      // @see https://github.com/cypress-io/cypress/issues/7663
      it.skip('gets indexed Interception by alias.number', function () {
        let interception
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, { bar: 'baz' }).as('alias')
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@alias').then((_interception) => {
          interception = _interception
        }).wait('@alias')

        cy.get('@alias.0').then((interception2) => {
          expect(interception).to.not.be.null
          expect(interception).to.eq(interception2)
        })
      })

      it('gets per-request aliased Interceptions', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'alias'
          req.reply({ bar: 'baz' })
        })
        .then(() => {
          $.get(url)
        })
        .wait('@alias').then((interception) => {
          cy.get('@alias').then((interception2) => {
            expect(interception).to.not.be.null
            expect(interception).to.eq(interception2)
          })
        })
      })

      it('yields null when no requests have been made', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(url).as('foo')
        cy.get('@foo').should('be.null')
      })
    })

    context('with an intercepted request', function () {
      it('can dynamically alias the request', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        .then(() => {
          const log = cy.queue.logs({
            displayName: 'xhr',
          })[0]

          const renderProps = log.get('renderProps')()

          expect(renderProps.interceptions).to.have.length(1)
          expect(renderProps.interceptions[0]).to.have.property('alias')
          expect(renderProps.interceptions[0].alias).to.eq('fromInterceptor')
        })
      })

      it('can dynamically alias the request and get with @alias.all', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .then(() => {
          $.get(url)
          $.get(url)
        })
        .wait('@fromInterceptor').wait('@fromInterceptor')
        .get('@fromInterceptor.all').should('have.length', 2)
      })

      it('can time out on a dynamic alias', function (done) {
        const url = uniqueRoute('/foo')

        testFailWaiting((err) => {
          expect(err.message).to.contain('for the 1st request to the route')
          done()
        })

        cy.intercept(url, (req) => {
          req.alias = 'fromInterceptor'
        })
        .wait('@fromInterceptor', { timeout: 100 })
      })

      it('dynamic aliases are fulfilled before route aliases', function (done) {
        const url = uniqueRoute('/foo')

        testFailWaiting((err) => {
          expect(err.message).to.contain('for the 1st request to the route: `fromAs`')
          done()
        })

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .as('fromAs')
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        // this will fail - dynamic aliasing maintains the existing wait semantics, including that each request can only be waited once
        .wait('@fromAs', { timeout: 100 })
      })

      it('fulfills both dynamic aliases when two are defined', function () {
        const url = uniqueRoute('/foo')

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'fromInterceptor'
        })
        .intercept(`${url}*`, (req) => {
          expect(req.alias).to.be.undefined
          req.alias = 'fromInterceptor2'
        })
        .then(() => {
          $.get(url)
        })
        .wait('@fromInterceptor')
        .wait('@fromInterceptor2')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8695
    context('yields request', function () {
      it('when not intercepted', function () {
        cy.intercept('/post-only').as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'some body')
      })

      it('when intercepted', function () {
        cy.intercept('/post-only', (req) => {
          req.body = 'changed'
        }).as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'changed')
      })

      it('when static response body is provided', function () {
        cy.intercept('/post-only', { static: 'response' }).as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'some body')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8536
    context('yields response', function () {
      const testResponse = (expectedBody, done) => {
        return () => {
          $.get('/xml')

          cy.wait('@foo').then((request) => {
            expect(request.response!.body).to.eq(expectedBody)
            done()
          })
        }
      }

      it('when not stubbed', function (done) {
        cy.intercept('/xml*').as('foo')
        .then(testResponse('<foo>bar</foo>', done))
      })

      it('when stubbed with StaticResponse', function (done) {
        cy.intercept('/xml*', 'something different')
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with req.reply', function (done) {
        cy.intercept('/xml*', (req) => req.reply('something different'))
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with res.send', function (done) {
        cy.intercept('/xml*', (req) => req.reply((res) => res.send('something different')))
        .as('foo')
        .then(testResponse('something different', done))
      })

      context('when stubbed with fixture', function () {
        it('with cy.intercept', function (done) {
          cy.intercept('/xml*', { fixture: 'null.json' })
          .as('foo')
          .then(testResponse('', done))
        })

        it('with req.reply', function (done) {
          cy.intercept('/xml*', (req) => req.reply({ fixture: 'null.json' }))
          .as('foo')
          .then(testResponse('', done))
        })

        it('with res.send', function (done) {
          cy.intercept('/xml*', (req) => {
            return req.continue((res) => {
              return res.send({
                fixture: 'null.json',
                headers: {
                  // since `res.headers['content-type'] is already 'application/xml' from origin,
                  // we must explicitly set the content-type to JSON here.
                  // luckily changing content-type like this is not a typical use case
                  'content-type': 'application/json',
                },
              })
            })
          })
          .as('foo')
          .then(testResponse('', done))
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/9580
    context('overwrite cy.intercept', () => {
      it('works with an alias by default', () => {
        const url = uniqueRoute('/foo')

        // sanity test before testing it with the cy.intercept overwrite
        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      it('works with an alias and function', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', function (originalIntercept, ...args) {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      it('works with an alias and arrow function', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', (originalIntercept, ...args) => {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, 'my value').as('netAlias')
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      it('works with dynamic alias', () => {
        let myInterceptCalled
        const url = uniqueRoute('/foo')

        cy.spy(cy, 'log')

        Cypress.Commands.overwrite('intercept', (originalIntercept, ...args) => {
          return cy.log('intercept!').then(() => {
            myInterceptCalled = true

            return originalIntercept(...args)
          })
        })

        cy.intercept(`${url}*`, (req) => {
          req.alias = 'netAlias'
          req.reply('my value')
        })
        .then(() => {
          return $.get(url)
        })
        .then(() => {
          expect(myInterceptCalled, 'my intercept was called').to.be.true
          expect(cy.log).to.have.been.calledWith('intercept!')
        })

        cy.wait('@netAlias').its('response.body').should('equal', 'my value')
      })

      // https://github.com/cypress-io/cypress/issues/14444
      it('can use dot in request alias', () => {
        cy.intercept('/users', (req) => {
          req.alias = 'get.url'
          req.reply('foo')
        })

        cy.window().then((win) => {
          const xhr = new win.XMLHttpRequest()

          xhr.open('GET', '/users')
          xhr.send()
        })

        cy.wait('@get.url')
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
