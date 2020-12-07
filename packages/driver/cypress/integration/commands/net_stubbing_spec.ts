describe('network stubbing', { retries: 2 }, function () {
  const { $, _, sinon, state, Promise } = Cypress

  beforeEach(function () {
    cy.spy(Cypress.utils, 'warning')
  })

  context('cy.route2()', function () {
    it('emits a warning', function () {
      cy.route2('*')
      .then(() => expect(Cypress.utils.warning).to.be.calledWith('`cy.route2()` was renamed to `cy.intercept()` and will be removed in a future release. Please update usages of `cy.route2()` to use `cy.intercept()` instead.'))
    })

    it('calls through to cy.intercept()', function (done) {
      cy.route2('*', 'hello world').then(() => {
        $.get('/abc123').done((responseText, _, xhr) => {
          expect(responseText).to.eq('hello world')

          done()
        })
      })
    })

    it('can be used with cy.wait', function () {
      cy.route2('*', 'hello world').as('foo')
      .then(() => $.get('/abc123')).wait('@foo')
    })
  })

  context('cy.intercept()', function () {
    beforeEach(function () {
      // we don't use cy.spy() because it causes an infinite loop with logging events
      this.sandbox = sinon.createSandbox()
      this.emit = this.sandbox.spy(Cypress, 'emit').withArgs('backend:request', 'net', 'route:added')

      this.testRoute = function (options, handler, expectedEvent, expectedRoute) {
        cy.intercept(options, handler).then(function () {
          const handlerId = _.findKey(state('routes'), { handler })
          const route = state('routes')[handlerId!]

          expectedEvent.handlerId = handlerId
          expect(this.emit).to.be.calledWith('backend:request', 'net', 'route:added', expectedEvent)

          expect(route.handler).to.deep.eq(expectedRoute.handler)
          expect(route.options).to.deep.eq(expectedRoute.options)
        })
      }
    })

    afterEach(function () {
      this.sandbox.restore()
    })

    it('emits with url, body and stores Route', function () {
      const handler = 'bar'
      const url = 'http://foo.invalid'
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

    it('emits with url, HTTPController and stores Route', function () {
      const handler = () => {
        return {}
      }

      const url = 'http://foo.invalid'
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

    it('emits with regex values stringified and other values copied and stores Route', function () {
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
        url: 'http://foo.invalid',
        webSocket: false,
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
          webSocket: options.webSocket,
        },
        hasInterceptor: true,
      }

      const expectedRoute = {
        options,
        handler,
      }

      this.testRoute(options, handler, expectedEvent, expectedRoute)
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
        cy.intercept('/foo', {}).then(function () {
          let lastLog

          lastLog = this.lastLog

          expect(lastLog.get('name')).to.eq('route')
        })
      })

      it('uses the wildcard URL', function () {
        cy.intercept('*', {}).then(function () {
          let lastLog

          lastLog = this.lastLog

          expect(lastLog.get('url')).to.eq('*')
        })
      })

      // TODO: implement log niceties
      it.skip('#consoleProps', function () {
        cy.intercept('*', {
          foo: 'bar',
        }).as('foo').then(function () {
          expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
            Command: 'route',
            Method: 'GET',
            URL: '*',
            Status: 200,
            Response: {
              foo: 'bar',
            },
            Alias: 'foo',
          })
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
          cy.intercept(/foo/, {}).then(function () {
            $.get('/foo')
          }).wrap(this).invoke('lastLog.get', 'numResponses').should('eq', 1)
        })

        it('is incremented for each matching request', function () {
          cy.intercept(/foo/, {}).then(function () {
            return Promise.all([$.get('/foo'), $.get('/foo'), $.get('/foo')])
          }).wrap(this).invoke('lastLog.get', 'numResponses').should('eq', 3)
        })
      })
    })

    context('errors', function () {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          this.logs.push(log)
        })
      })

      it('url must be a string or regexp', function (done) {
        cy.on('fail', function (err) {
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
        cy.on('fail', function (err) {
          expect(err.message).to.include('cy.intercept() was called with an invalid method: \'POSTS\'.')

          done()
        })

        cy.intercept('post', '/foo', {})
      })

      it('requires a url when given a response', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        cy.intercept({})
      })

      it('requires arguments', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('An invalid RouteMatcher was supplied to `cy.intercept()`. The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        // @ts-ignore - should fail
        cy.intercept()
      })

      context('with invalid RouteMatcher', function () {
        it('requires unique header names', function (done) {
          cy.on('fail', function (err) {
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
          cy.on('fail', function (err) {
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
      })

      context('with invalid handler', function () {
        [false, null].forEach(function (handler) {
          const name = String(handler)

          it(`${name} fails`, function (done) {
            cy.on('fail', (err) => {
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
          [
            'headers invalid type',
            {
              headers: {
                a: {
                  1: 2,
                },
              },
            },
            'must be a map',
          ],
        ].forEach(function ([name, handler, expectedErr]) {
          it(`${name} fails`, function (done) {
            cy.on('fail', (err) => {
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
      cy.intercept('/valid.json', (req) => {
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
      const url2 = `https://localhost:3502/redirect?chunked=1&href=${encodeURIComponent(url3)}`
      const url1 = `https://localhost:3502/redirect?chunked=1&href=${encodeURIComponent(url2)}`

      cy.visit(url1)
      .location('href').should('eq', url4)
    })

    context('can intercept against any domain', function () {
      beforeEach(function () {
        // reset origin
        cy.visit('http://localhost:3500/fixtures/generic.html')
      })

      it('different origin (HTTP)', function () {
        cy.intercept('/foo').as('foo')
        .then(() => {
          $.get('http://baz.foobar.com:3501/foo')
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTP)', function () {
        cy.intercept('/xhr.html', (req) => {
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
        cy.intercept('/foo', 'somethin').as('foo')
        .then(() => {
          $.get('https://bar.foobar.com.invalid:3502/foo')
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTPS)', function () {
        cy.intercept('/xhr.html', (req) => {
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
      cy.intercept('/foo', '<html>hello cruel world</html>').visit('/foo').document().should('contain.text', 'hello cruel world')
    })

    it('can stub a response with an empty StaticResponse', function (done) {
      cy.intercept('/', {}).then(() => {
        $.get('/').done((responseText, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseText).to.eq('')

          done()
        })
      })
    })

    it('can stub a response with a network error', function (done) {
      cy.intercept('/', {
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
      cy.intercept('/foo', 'foo bar baz').as('getFoo').then(function (win) {
        $.get('/foo')
      }).wait('@getFoo').then(function (res) {
        expect(res.response!.body).to.eq('foo bar baz')
      })
    })

    it('can stub requests with uncommon HTTP methods', function () {
      cy.intercept('PROPFIND', '/foo', 'foo bar baz').as('getFoo').then(function (win) {
        $.ajax({
          url: '/foo',
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

    // TODO: flaky - unable to reproduce outside of CI
    it('still works after a cy.visit', { retries: 2 }, function () {
      cy.intercept(/foo/, {
        body: JSON.stringify({ foo: 'bar' }),
        headers: {
          'content-type': 'application/json',
        },
      }).as('getFoo').visit('http://localhost:3500/fixtures/jquery.html').window().then(function (win) {
        return new Promise(function (resolve) {
          $.get('/foo').done(_.ary(resolve, 0))
        })
      }).wait('@getFoo').its('request.url').should('include', '/foo').visit('http://localhost:3500/fixtures/generic.html').window().then(function (win) {
        return new Promise(function (resolve) {
          $.get('/foo').done(_.ary(resolve, 0))
        })
      }).wait('@getFoo').its('request.url').should('include', '/foo')
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

      // @see https://github.com/cypress-io/cypress/issues/8623
      it('works with images', function () {
        cy.visit('/fixtures/img-embed.html')
        .contains('div', 'error loading image')
        .intercept('non-existing-image.png', { fixture: 'media/cypress.png' })
        .reload()
        .contains('div', 'it loaded')
      })
    })
  })

  context('intercepting request', function () {
    it('receives the original request in handler', function (done) {
      cy.intercept('/def456', function (req) {
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

    it('can modify original request body and have it passed to next handler', function (done) {
      cy.intercept('/post-only', function (req) {
        expect(req.body).to.eq('foo-bar-baz')
        req.body = 'quuz'
      }).then(function () {
        cy.intercept('/post-only', function (req) {
          expect(req.body).to.eq('quuz')
          req.body = 'quux'
        })
      }).then(function () {
        cy.intercept('/post-only', function (req) {
          expect(req.body).to.eq('quux')

          done()
        })
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

    it('can add a body to a request that does not have one', function (done) {
      const body = '{"foo":"bar"}'

      cy.intercept('/post-only', function (req) {
        expect(req.body).to.eq('')
        expect(req.method).to.eq('GET')
        req.method = 'POST'
        req.headers['content-type'] = 'application/json'

        req.body = body
      }).then(function () {
        $.get('/post-only').done((responseText) => {
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

    it('can delay and throttle a StaticResponse', function (done) {
      const payload = 'A'.repeat(10 * 1024)
      const throttleKbps = 10
      const delayMs = 250
      const expectedSeconds = payload.length / (1024 * throttleKbps) + delayMs / 1000

      cy.intercept('/timeout', (req) => {
        this.start = Date.now()

        req.reply({
          statusCode: 200,
          body: payload,
          throttleKbps,
          delayMs,
        })
      }).then(() => {
        return $.get('/timeout').then((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000 + 100, 100)
          expect(responseText).to.eq(payload)

          done()
        })
      })
    })

    context('body parsing', function () {
      it('automatically parses JSON request bodies', function () {
        const p = Promise.defer()

        cy.intercept('/post-only', (req) => {
          expect(req.body).to.deep.eq({ foo: 'bar' })

          p.resolve()
        }).as('post')
        .then(() => {
          return $.ajax({
            url: '/post-only',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ foo: 'bar' }),
          })
        }).then((responseText) => {
          expect(responseText).to.include('request body:<br>{"foo":"bar"}')

          return p
        })
        .wait('@post').its('request.body').should('deep.eq', { foo: 'bar' })
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

        cy.intercept('/post-only', (req) => {
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
        cy.intercept({
          query: {
            foo: 'b*r',
            baz: /quu[x]/,
          },
        }).as('first')
        .intercept({
          path: '/abc?foo=bar&baz=qu*x*',
        }).as('second')
        .intercept({
          pathname: '/abc',
        }).as('third')
        .intercept('*', 'it worked').as('final')
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
        cy.intercept({
          headers: {
            'X-some-Thing': 'foo',
          },
        })
        .as('foo')
        .then(() => {
          $.get({
            url: '/foo',
            headers: {
              'X-SOME-THING': 'foo',
            },
          })
        })
        .wait('@foo')
      })
    })

    context('with StaticResponse shorthand', function () {
      it('req.reply(body)', function () {
        cy.intercept('/foo', function (req) {
          req.reply('baz')
        })
        .then(() => $.get('/foo'))
        .should('eq', 'baz')
      })

      it('req.reply(json)', function () {
        cy.intercept('/foo', function (req) {
          req.reply({ baz: 'quux' })
        })
        .then(() => $.getJSON('/foo'))
        .should('deep.eq', { baz: 'quux' })
      })

      it('req.reply(status)', function () {
        cy.intercept('/foo', function (req) {
          req.reply(777)
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get('/foo').fail((x) => resolve(x.status))
          })
        })
        .should('eq', 777)
      })

      it('req.reply(status, body)', function () {
        cy.intercept('/foo', function (req) {
          req.reply(777, 'bar')
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get('/foo').fail((xhr) => resolve(_.pick(xhr, 'status', 'responseText')))
          })
        }).should('include', {
          status: 777,
          responseText: 'bar',
        })
      })

      it('req.reply(status, json)', function () {
        cy.intercept('/foo', function (req) {
          req.reply(777, { bar: 'baz' })
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get('/foo').fail((xhr) => resolve(_.pick(xhr, 'status', 'responseJSON')))
          })
        }).should('deep.include', {
          status: 777,
          responseJSON: { bar: 'baz' },
        })
      })

      it('req.reply(status, json, headers)', function () {
        cy.intercept('/foo', function (req) {
          req.reply(777, { bar: 'baz' }, { 'x-quux': 'quuz' })
        })
        .then(() => {
          return new Promise((resolve) => {
            $.get('/foo').fail((xhr) => resolve(_.pick(xhr, 'status', 'responseJSON', 'getAllResponseHeaders')))
          })
        }).should('deep.include', {
          status: 777,
          responseJSON: { bar: 'baz' },
        }).invoke('getAllResponseHeaders')
        .should('include', 'x-quux: quuz')
        .and('include', 'content-type: application/json')
      })

      it('can forceNetworkError', function (done) {
        cy.intercept('/foo', function (req) {
          req.reply({ forceNetworkError: true })
        })
        .then(() => {
          $.get('/foo').fail((xhr) => {
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
      it('passes request through in order', function () {
        cy.intercept('/dump-method', function (req) {
          expect(req.method).to.eq('GET')
          req.method = 'POST'
        }).intercept('/dump-method', function (req) {
          expect(req.method).to.eq('POST')
          req.method = 'PATCH'
        }).intercept('/dump-method', function (req) {
          expect(req.method).to.eq('PATCH')

          req.reply()
        }).visit('/dump-method').contains('PATCH')
      })

      it('stops passing request through once req.reply called', function () {
        cy.intercept('/dump-method', function (req) {
          expect(req.method).to.eq('GET')
          req.method = 'POST'
        }).intercept('/dump-method', function (req) {
          expect(req.method).to.eq('POST')

          req.reply()
        }).visit('/dump-method').contains('POST')
      })
    })

    context('errors', function () {
      it('fails test if req.reply is called twice in req handler', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('`req.reply()` was called multiple times in a request handler, but a request can only be replied to once')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          req.reply()

          req.reply()
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler finishes', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler resolves', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.intercept('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)

          return Promise.resolve()
        }).visit('/dump-method')
      })

      it('fails test if an exception is thrown in req handler', function (done) {
        cy.on('fail', (err2) => {
          expect(err2.message).to.contain('A request callback passed to `cy.intercept()` threw an error while intercepting a request')
          .and.contain(err.message)

          done()
        })

        const err = new Error('bar')

        cy.intercept('/foo', () => {
          throw err
        }).visit('/foo')
      })

      it('fails test if req.reply is called with an invalid StaticResponse', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('A request callback passed to `cy.intercept()` threw an error while intercepting a request')
          .and.contain('must be a number between 100 and 999 (inclusive).')

          done()
        })

        cy.intercept('/foo', (req) => {
          req.reply({ statusCode: 1 })
        }).visit('/foo')
      })

      it('can timeout in request handler', function (done) {
        cy.on('fail', (err) => {
          Cypress.config('defaultCommandTimeout', 5000)
          expect(err.message).to.match(/^A request callback passed to `cy.intercept\(\)` timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

          done()
        })

        Cypress.config('defaultCommandTimeout', 50)

        cy.intercept('/foo', () => {
          return Promise.delay(200)
        }).visit('/foo')
      })
    })

    context('correctly determines the content-length of an intercepted request', function () {
      it('when body is empty', function (done) {
        cy.intercept('/post-only', function (req) {
          req.body = ''
        }).then(function () {
          cy.intercept('/post-only', function (req) {
            expect(req.headers['content-length']).to.eq('0')

            done()
          })
        })
        .then(() => {
          $.post('/post-only', 'foo')
        })
      })

      it('when body contains ascii', function (done) {
        cy.intercept('/post-only', function (req) {
          req.body = 'this is only ascii'
        }).then(function () {
          cy.intercept('/post-only', function (req) {
            expect(req.headers['content-length']).to.eq('18')

            done()
          })
        })
        .then(() => {
          $.post('/post-only', 'bar')
        })
      })

      it('when body contains unicode', function (done) {
        cy.intercept('/post-only', function (req) {
          req.body = '🙃🤔'
        }).then(function () {
          cy.intercept('/post-only', function (req) {
            expect(req.headers['content-length']).to.eq('8')

            done()
          })
        })
        .then(() => {
          $.post('/post-only', 'baz')
        })
      })
    })
  })

  context('intercepting response', function () {
    it('receives the original response in handler', function (done) {
      cy.intercept('/json-content-type', function (req) {
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

      cy.intercept('/redirect', (req) => {
        req.reply((res) => {
          expect(res.statusCode).to.eq(301)
          expect(res.headers.location).to.eq(href)
          res.send()
        })
      })
      .as('redirect')
      .intercept('/fixtures/generic.html').as('dest')
      .then(() => fetch(url))
      .wait('@redirect')
      .wait('@dest')
    })

    it('can simply wait on redirects without intercepting', function () {
      const href = `/fixtures/generic.html?t=${Date.now()}`
      const url = `/redirect?href=${encodeURIComponent(href)}`

      cy.intercept('/redirect')
      .as('redirect')
      .intercept('/fixtures/generic.html').as('dest')
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
      browser: '!firefox', // TODO: why does firefox behave differently? transparently returns cached response
    }, function () {
      // use a queryparam to bust cache from previous runs of this test
      const url = `/fixtures/generic.html?t=${Date.now()}`
      let hits = 0

      cy.intercept('/fixtures/generic.html', (req) => {
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

    it('can delay a proxy response using res.delay', function (done) {
      cy.intercept('/timeout', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.delay(1000).send('delay worked')
        })
      }).then(() => {
        $.get('/timeout')
        .done((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(1100, 100)
          expect(responseText).to.include('delay worked')

          done()
        })
      })
    })

    it('can \'delay\' a proxy response using Promise.delay', function (done) {
      cy.intercept('/timeout', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          return Promise.delay(1000)
          .then(() => {
            res.send('Promise.delay worked')
          })
        })
      }).then(() => {
        $.get('/timeout').then((responseText) => {
          expect(Date.now() - this.start).to.be.closeTo(1000, 100)
          expect(responseText).to.eq('Promise.delay worked')

          done()
        })
      })
    })

    it('can throttle a proxy response using res.throttle', function (done) {
      cy.intercept('/1mb', (req) => {
        // don't let gzip make response smaller and throw off the timing
        delete req.headers['accept-encoding']

        req.reply((res) => {
          this.start = Date.now()

          res.throttle(1024).send()
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

    it('can throttle a static response using res.throttle', function (done) {
      const payload = 'A'.repeat(10 * 1024)
      const kbps = 10
      const expectedSeconds = payload.length / (1024 * kbps)

      cy.intercept('/timeout', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.throttle(kbps).send(payload)
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
      const delayMs = 500

      expectedSeconds += delayMs / 1000

      cy.intercept('/timeout', (req) => {
        req.reply((res) => {
          this.start = Date.now()

          res.throttle(kbps).delay(delayMs).send({
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

    context('body parsing', function () {
      it('automatically parses JSON response bodies', function () {
        const p = Promise.defer()

        cy.intercept('/foo.bar.baz.json', (req) => {
          req.reply((res) => {
            expect(res.body).to.deep.eq({ quux: 'quuz' })
            p.resolve()
          })
        }).as('get')
        .then(() => {
          return $.get('/fixtures/foo.bar.baz.json')
        }).then((responseJson) => {
          expect(responseJson).to.deep.eq({ quux: 'quuz' })

          return p
        })
        .wait('@get').its('response.body').should('deep.eq', { quux: 'quuz' })
      })

      it('doesn\'t automatically parse JSON response bodies if content-type is wrong', function () {
        const p = Promise.defer()

        cy.intercept('/json.txt', (req) => {
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

      it('sets body to string if JSON is malformed', function () {
        const p = Promise.defer()

        cy.intercept('/invalid.json', (req) => {
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
        cy.intercept('/custom-headers', function (req) {
          req.reply((res) => {
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
        cy.intercept('/custom-headers', function (req) {
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
        cy.intercept('/custom-headers', function (req) {
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
        cy.intercept('/custom-headers', function (req) {
          req.reply((res) => {
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
        cy.intercept('/custom-headers', function (req) {
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
        cy.intercept('/custom-headers', function (req) {
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

      it('can forceNetworkError', function (done) {
        cy.intercept('/foo', function (req) {
          req.reply((res) => {
            res.send({ forceNetworkError: true })
          })
        })
        .then(() => {
          $.get('/foo').fail((xhr) => {
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
        const delayMs = 50
        const expectedSeconds = payload.length / (1024 * throttleKbps) + delayMs / 1000

        cy.intercept('/timeout', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            // ensure .throttle and .delay are overridden
            res.throttle(1e6).delay(1).send({
              statusCode: 200,
              body: payload,
              throttleKbps,
              delayMs,
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

    context('errors', function () {
      it('fails test if res.send is called twice in req handler', function (done) {
        cy.on('fail', (err) => {
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
        cy.on('fail', (err2) => {
          expect(err2.message).to.contain('A response callback passed to `req.reply()` threw an error while intercepting a response')
          .and.contain(err.message)

          done()
        })

        const err = new Error('bar')

        cy.intercept('/foo', (req) => {
          req.reply(() => {
            throw err
          })
        })
        .then(() => {
          $.get('/foo')
        })
        .wait(1000)
      })

      it('fails test if res.send is called with an invalid StaticResponse', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('A response callback passed to `req.reply()` threw an error while intercepting a response')
          .and.contain('must be a number between 100 and 999 (inclusive).')

          done()
        })

        cy.intercept('/foo', (req) => {
          req.reply((res) => {
            res.send({ statusCode: 1 })
          })
        })
        .then(() => {
          $.get('/foo')
        })
      })

      it('fails test if network error occurs retrieving response and response is intercepted', function (done) {
        cy.on('fail', (err) => {
          expect(err.message)
          .to.contain('\`req.reply()\` was provided a callback to intercept the upstream response, but a network error occurred while making the request:')
          .and.contain('Error: connect ECONNREFUSED 127.0.0.1:3333')

          done()
        })

        cy.intercept('/should-err', function (req) {
          req.reply(() => {})
        }).then(function () {
          $.get('http://localhost:3333/should-err')
        })
      })

      it('doesn\'t fail test if network error occurs retrieving response and response is not intercepted', {
        // TODO: for some reason, this test is busted in FF
        browser: '!firefox',
      }, function (done) {
        cy.on('fail', (err) => {
          // the test should have failed due to cy.wait, as opposed to because of a network error
          expect(err.message).to.contain('Timed out retrying')
          done()
        })

        cy.intercept('/should-err', function (req) {
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
        cy.on('fail', (err) => {
          Cypress.config('defaultCommandTimeout', 5000)
          expect(err.message).to.match(/^A response callback passed to `req.reply\(\)` timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

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
          expect(err.message).to.match(/^`req\.reply\(\)` was provided a callback to intercept the upstream response, but the request timed out after the `responseTimeout` of `25ms`\./)
          .and.match(/ESOCKETTIMEDOUT|ETIMEDOUT/)

          done()
        })

        cy.intercept('/timeout', (req) => {
          req.reply(_.noop)
        }).then(() => {
          $.get('/timeout?ms=50')
        })
      })
    })
  })

  context('waiting and aliasing', function () {
    it('can wait on a single response using "alias"', function () {
      cy.intercept('/foo', 'bar')
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar')
    })

    it('can timeout waiting on a single response using "alias"', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can wait on a single response using "alias.response"', function () {
      cy.intercept('/foo', 'bar')
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.response')
    })

    it('can timeout waiting on a single response using "alias.response"', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('No response ever occurred.')
        done()
      })

      cy.intercept('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.response', { timeout: 100 })
    })

    it('can wait on a single request using "alias.request"', function () {
      cy.intercept('/foo')
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.request')
    })

    it('can timeout waiting on a single request using "alias.request"', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('No request ever occurred.')
        done()
      })

      cy.intercept('/foo')
      .as('foo.bar')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can incrementally wait on responses', function () {
      cy.intercept('/foo', 'bar')
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar')
    })

    it('can timeout incrementally waiting on responses', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('for the 1st response to the route')
        done()
      })

      cy.intercept('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
        $.get('/foo')
      })
      .wait('@foo.bar', { timeout: 100 })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can incrementally wait on requests', function () {
      cy.intercept('/foo', (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.request')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.request')
    })

    it('can timeout incrementally waiting on requests', function (done) {
      cy.on('fail', (err) => {
        expect(err.message).to.contain('for the 2nd request to the route')
        done()
      })

      cy.intercept('/foo', (req) => {
        req.reply(_.noop) // only request will be received, no response
      })
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.request')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can alias a route without stubbing it', function () {
      cy.intercept(/fixtures\/app/).as('getFoo').then(function () {
        $.get('/fixtures/app.json')
      }).wait('@getFoo').then(function (res) {
        const log = cy.queue.logs({
          displayName: 'req',
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
      cy.intercept('/status-code').as('status')
      .then(() => {
        $.get('/status-code?code=204')
      })
      .wait('@status').its('response.statusCode').should('eq', 204)
    })

    // @see https://github.com/cypress-io/cypress/issues/8934
    it('can spy on a 304 not modified image response', function () {
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

    context('with an intercepted request', function () {
      it('can dynamically alias the request', function () {
        cy.intercept('/foo', (req) => {
          req.alias = 'fromInterceptor'
        })
        .then(() => {
          $.get('/foo')
        })
        .wait('@fromInterceptor')
      })

      it('can time out on a dynamic alias', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('for the 1st request to the route')
          done()
        })

        cy.intercept('/foo', (req) => {
          req.alias = 'fromInterceptor'
        })
        .wait('@fromInterceptor', { timeout: 100 })
      })

      it('dynamic aliases are fulfilled before route aliases', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('for the 1st request to the route: `fromAs`')
          done()
        })

        cy.intercept('/foo', (req) => {
          req.alias = 'fromInterceptor'
        })
        .as('fromAs')
        .then(() => {
          $.get('/foo')
        })
        .wait('@fromInterceptor')
        // this will fail - dynamic aliasing maintains the existing wait semantics, including that each request can only be waited once
        .wait('@fromAs', { timeout: 100 })
      })

      it('fulfills both dynamic aliases when two are defined', function () {
        cy.intercept('/foo', (req) => {
          req.alias = 'fromInterceptor'
        })
        .intercept('/foo', (req) => {
          expect(req.alias).to.be.undefined
          req.alias = 'fromInterceptor2'
        })
        .then(() => {
          $.get('/foo')
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
        cy.intercept('/xml').as('foo')
        .then(testResponse('<foo>bar</foo>', done))
      })

      it('when stubbed with StaticResponse', function (done) {
        cy.intercept('/xml', 'something different')
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with req.reply', function (done) {
        cy.intercept('/xml', (req) => req.reply('something different'))
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with res.send', function (done) {
        cy.intercept('/xml', (req) => req.reply((res) => res.send('something different')))
        .as('foo')
        .then(testResponse('something different', done))
      })
    })
  })
})
