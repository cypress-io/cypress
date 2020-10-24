describe('network stubbing', function () {
  const { $, _, sinon, state, Promise } = Cypress

  beforeEach(function () {
    cy.spy(Cypress.utils, 'warning')
  })

  context('cy.route2()', function () {
    beforeEach(function () {
      // we don't use cy.spy() because it causes an infinite loop with logging events
      this.sandbox = sinon.createSandbox()
      this.emit = this.sandbox.spy(Cypress, 'emit').withArgs('backend:request', 'net', 'route:added')

      this.testRoute = function (options, handler, expectedEvent, expectedRoute) {
        cy.route2(options, handler).then(function () {
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
      cy.route2('POST', 'http://dummy.restapiexample.com/api/v1/create').as('create')

      cy.window().then((win) => {
        win.eval(
          `fetch("http://dummy.restapiexample.com/api/v1/create", {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
          });`,
        )
      })

      cy.wait('@create')
    })

    // TODO: implement warning in cy.route2 if appropriate
    // https://github.com/cypress-io/cypress/issues/2372
    it.skip('warns if a percent-encoded URL is used', function () {
      cy.route2('GET', '/foo%25bar').then(function () {
        expect(Cypress.utils.warning).to.be.calledWith('A URL with percent-encoded characters was passed to cy.route2(), but cy.route2() expects a decoded URL.\n\nDid you mean to pass "/foo%bar"?')
      })
    })

    // NOTE: see todo on 'warns if a percent-encoded URL is used'
    it.skip('does not warn if an invalid percent-encoded URL is used', function () {
      cy.route2('GET', 'http://example.com/%E0%A4%A').then(function () {
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
        cy.route2('/foo', {}).then(function () {
          let lastLog

          lastLog = this.lastLog

          expect(lastLog.get('name')).to.eq('route')
        })
      })

      it('uses the wildcard URL', function () {
        cy.route2('*', {}).then(function () {
          let lastLog

          lastLog = this.lastLog

          expect(lastLog.get('url')).to.eq('*')
        })
      })

      // TODO: implement log niceties
      it.skip('#consoleProps', function () {
        cy.route2('*', {
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
          cy.route2(/foo/, {}).then(() => {
            let lastLog

            lastLog = this.lastLog

            expect(lastLog.get('numResponses')).to.eq(0)
          })
        })

        it('is incremented to 2', function () {
          cy.route2(/foo/, {}).then(function () {
            $.get('/foo')
          }).wrap(this).invoke('lastLog.get', 'numResponses').should('eq', 1)
        })

        it('is incremented for each matching request', function () {
          cy.route2(/foo/, {}).then(function () {
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

      it('if experimentalNetworkStubbing is falsy', function (done) {
        sinon.stub(Cypress, 'config').callThrough()
        // @ts-ignore
        .withArgs('experimentalNetworkStubbing').returns(false)

        cy.on('fail', (err) => {
          expect(err.message).to.contain('`cy.route2()` requires experimental network mocking to be enabled.')
          sinon.restore()
          done()
        })

        cy.route2('', '')
      })

      it('url must be a string or regexp', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('`url` must be a string or a regular expression')

          done()
        })

        // @ts-ignore: should fail
        cy.route2({
          // @ts-ignore
          url: {},
        })
      })

      // TODO: not currently implemented
      it.skip('fails when method is invalid', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('cy.route2() was called with an invalid method: \'POSTS\'.')

          done()
        })

        cy.route2('post', '/foo', {})
      })

      it('requires a url when given a response', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        cy.route2({})
      })

      it('requires arguments', function (done) {
        cy.on('fail', function (err) {
          expect(err.message).to.include('An invalid RouteMatcher was supplied to `cy.route2()`. The RouteMatcher does not contain any keys. You must pass something to match on.')

          done()
        })

        // @ts-ignore - should fail
        cy.route2()
      })

      context('with invalid RouteMatcher', function () {
        it('requires unique header names', function (done) {
          cy.on('fail', function (err) {
            expect(err.message).to.include('`FOO` was specified more than once in `headers`. Header fields can only be matched once (HTTP header field names are case-insensitive).')

            done()
          })

          cy.route2({
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
          cy.route2({
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
            cy.route2('/', handler)
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
            cy.route2('/', handler)
          })
        })
      })
    })
  })

  context('network handling', function () {
    // @see https://github.com/cypress-io/cypress/issues/8497
    it('can load transfer-encoding: chunked redirects', function () {
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
        cy.route2('/foo').as('foo')
        .then(() => {
          $.get('http://baz.foobar.com:3501/foo')
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTP)', function () {
        cy.route2('/xhr.html', (req) => {
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
        cy.route2('/foo', 'somethin').as('foo')
        .then(() => {
          $.get('https://bar.foobar.com.invalid:3502/foo')
        })
        .wait('@foo')
      })

      it('different origin with response interception (HTTPS)', function () {
        cy.route2('/xhr.html', (req) => {
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
      cy.route2({
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
      cy.route2('/foo', '<html>hello cruel world</html>').visit('/foo').document().should('contain.text', 'hello cruel world')
    })

    it('can stub a response with an empty StaticResponse', function (done) {
      cy.route2('/', {}).then(() => {
        $.get('/').done((responseText, _, xhr) => {
          expect(xhr.status).to.eq(200)
          expect(responseText).to.eq('')

          done()
        })
      })
    })

    it('can stub a response with a network error', function (done) {
      cy.route2('/', {
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
      cy.route2('/foo', 'foo bar baz').as('getFoo').then(function (win) {
        $.get('/foo')
      }).wait('@getFoo').then(function (res) {
        expect(res.response.body).to.eq('foo bar baz')
      })
    })

    it('can stub requests with uncommon HTTP methods', function () {
      cy.route2('PROPFIND', '/foo', 'foo bar baz').as('getFoo').then(function (win) {
        $.ajax({
          url: '/foo',
          method: 'PROPFIND',
        })
      }).wait('@getFoo').then(function (res) {
        expect(res.response.body).to.eq('foo bar baz')
      })
    })

    it('can stub a response with an array', function (done) {
      const response = ['foo', 'bar', { foo: 'baz' }]

      cy.route2({
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
      cy.route2(/foo/, {
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
        cy.route2({
          url: '*',
        }, {
          body: [],
        }).then(assertEmptyArray(done))
      })

      it('with body shorthand', function (done) {
        cy.route2('*', []).then(assertEmptyArray(done))
      })

      it('with method, url, res shorthand', function (done) {
        cy.route2('GET', '*', []).then(assertEmptyArray(done))
      })

      it('in req.reply', function (done) {
        cy.route2('*', (req) => req.reply([])).then(assertEmptyArray(done))
      })

      it('in res.send', function (done) {
        cy.route2('*', (req) => req.reply((res) => res.send(200, []))).then(assertEmptyArray(done))
      })
    })

    context('fixtures', function () {
      it('can stub a response with a JSON object', function () {
        cy.route2({
          method: 'POST',
          url: '/test-xhr',
        }, {
          fixture: 'valid.json',
        }).visit('/fixtures/xhr-triggered.html').get('#trigger-xhr').click()

        cy.contains('#result', '{"foo":1,"bar":{"baz":"cypress"}}').should('be.visible')
      })

      it('works with content-type override', function () {
        cy.route2({
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
        cy.route2({
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
        .route2('non-existing-image.png', { fixture: 'media/cypress.png' })
        .reload()
        .contains('div', 'it loaded')
      })
    })
  })

  context('intercepting request', function () {
    it('receives the original request in handler', function (done) {
      cy.route2('/def456', function (req) {
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
      cy.route2('/aaa', function (req) {
        expect(req.body).to.eq('foo-bar-baz')

        done()
      }).then(function () {
        $.post('/aaa', 'foo-bar-baz')
      })
    })

    it('can modify original request body and have it passed to next handler', function (done) {
      cy.route2('/post-only', function (req) {
        expect(req.body).to.eq('foo-bar-baz')
        req.body = 'quuz'
      }).then(function () {
        cy.route2('/post-only', function (req) {
          expect(req.body).to.eq('quuz')
          req.body = 'quux'
        })
      }).then(function () {
        cy.route2('/post-only', function (req) {
          expect(req.body).to.eq('quux')

          done()
        })
      }).then(function () {
        $.post('/post-only', 'foo-bar-baz')
      })
    })

    it('can modify a cy.visit before it goes out', function () {
      cy.route2('/dump-headers', function (req) {
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
      cy.route2('/does-not-exist', function (req) {
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
      cy.route2('/dump-method', function (req) {
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

      cy.route2('/post-only', function (req) {
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

      cy.route2('/post-only', function (req) {
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
      cy.route2({
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

      cy.route2('/timeout', (req) => {
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

    context('matches requests as expected', function () {
      it('handles querystrings as expected', function () {
        cy.route2({
          query: {
            foo: 'b*r',
            baz: /quu[x]/,
          },
        }).as('first')
        .route2({
          path: '/abc?foo=bar&baz=qu*x*',
        }).as('second')
        .route2({
          pathname: '/abc',
        }).as('third')
        .route2('*', 'it worked').as('final')
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
        cy.route2({
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
        cy.route2('/foo', function (req) {
          req.reply('baz')
        })
        .then(() => $.get('/foo'))
        .should('eq', 'baz')
      })

      it('req.reply(json)', function () {
        cy.route2('/foo', function (req) {
          req.reply({ baz: 'quux' })
        })
        .then(() => $.getJSON('/foo'))
        .should('deep.eq', { baz: 'quux' })
      })

      it('req.reply(status)', function () {
        cy.route2('/foo', function (req) {
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
        cy.route2('/foo', function (req) {
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
        cy.route2('/foo', function (req) {
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
        cy.route2('/foo', function (req) {
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
        cy.route2('/foo', function (req) {
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
        cy.route2('/dump-method', function (req) {
          expect(req.method).to.eq('GET')
          req.method = 'POST'
        }).route2('/dump-method', function (req) {
          expect(req.method).to.eq('POST')
          req.method = 'PATCH'
        }).route2('/dump-method', function (req) {
          expect(req.method).to.eq('PATCH')

          req.reply()
        }).visit('/dump-method').contains('PATCH')
      })

      it('stops passing request through once req.reply called', function () {
        cy.route2('/dump-method', function (req) {
          expect(req.method).to.eq('GET')
          req.method = 'POST'
        }).route2('/dump-method', function (req) {
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

        cy.route2('/dump-method', function (req) {
          req.reply()

          req.reply()
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler finishes', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.route2('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)
        }).visit('/dump-method')
      })

      it('fails test if req.reply is called after req handler resolves', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('> `req.reply()` was called after the request handler finished executing')
          done()
        })

        cy.route2('/dump-method', function (req) {
          setTimeout(() => req.reply(), 50)

          return Promise.resolve()
        }).visit('/dump-method')
      })

      it('fails test if an exception is thrown in req handler', function (done) {
        cy.on('fail', (err2) => {
          expect(err2.message).to.contain('A request callback passed to `cy.route2()` threw an error while intercepting a request')
          .and.contain(err.message)

          done()
        })

        const err = new Error('bar')

        cy.route2('/foo', () => {
          throw err
        }).visit('/foo')
      })

      it('fails test if req.reply is called with an invalid StaticResponse', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('A request callback passed to `cy.route2()` threw an error while intercepting a request')
          .and.contain('must be a number between 100 and 999 (inclusive).')

          done()
        })

        cy.route2('/foo', (req) => {
          req.reply({ statusCode: 1 })
        }).visit('/foo')
      })

      it('can timeout in request handler', {
        defaultCommandTimeout: 50,
        retries: 1,
      }, function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.match(/^A request callback passed to `cy.route2\(\)` timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

          done()
        })

        cy.route2('/foo', () => {
          return Promise.delay(200)
        }).visit('/foo')
      })
    })
  })

  context('intercepting response', function () {
    it('receives the original response in handler', function (done) {
      cy.route2('/json-content-type', function (req) {
        req.reply(function (res) {
          expect(res.body).to.eq('{}')

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

      cy.route2('/redirect', (req) => {
        req.reply((res) => {
          expect(res.statusCode).to.eq(301)
          expect(res.headers.location).to.eq(href)
          res.send()
        })
      })
      .as('redirect')
      .route2('/fixtures/generic.html').as('dest')
      .then(() => fetch(url))
      .wait('@redirect')
      .wait('@dest')
    })

    // @see https://github.com/cypress-io/cypress/issues/7967
    it('can skip redirects via followRedirect', function () {
      const href = `/fixtures/generic.html?t=${Date.now()}`
      const url = `/redirect?href=${encodeURIComponent(href)}`

      cy.route2('/redirect', (req) => {
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

      cy.route2('/fixtures/generic.html', (req) => {
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
      cy.route2('/1mb', (req) => {
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
      cy.route2('/timeout', (req) => {
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
      cy.route2('/timeout', (req) => {
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
      cy.route2('/1mb', (req) => {
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

      cy.route2('/timeout', (req) => {
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

      cy.route2('/timeout', (req) => {
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
      cy.route2({
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

    context('with StaticResponse', function () {
      it('res.send(body)', function () {
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/custom-headers', function (req) {
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
        cy.route2('/foo', function (req) {
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

        cy.route2('/timeout', (req) => {
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
            expect(responseText).to.eq(payload)
            expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000 + 50, 50)

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

        cy.route2('/dump-method', function (req) {
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

        cy.route2('/foo', (req) => {
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

        cy.route2('/foo', (req) => {
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

        cy.route2('/should-err', function (req) {
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

        cy.route2('/should-err', function (req) {
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

      it('can timeout in req.reply handler', {
        defaultCommandTimeout: 50,
        retries: 1,
      }, function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.match(/^A response callback passed to `req.reply\(\)` timed out after returning a Promise that took more than the `defaultCommandTimeout` of `50ms` to resolve\./)

          done()
        })

        cy.route2('/timeout', (req) => {
          req.reply(() => {
            return Promise.delay(200)
          })
        }).visit('/timeout', { timeout: 500 })
      })

      it('can timeout when retrieving upstream response', {
        responseTimeout: 25,
      }, function (done) {
        cy.once('fail', (err) => {
          expect(err.message).to.match(/^`req\.reply\(\)` was provided a callback to intercept the upstream response, but the request timed out after the `responseTimeout` of `25ms`\./)
          .and.contain('ESOCKETTIMEDOUT')

          done()
        })

        cy.route2('/timeout', (req) => {
          req.reply(_.noop)
        }).then(() => {
          $.get('/timeout?ms=50')
        })
      })
    })
  })

  context('waiting and aliasing', function () {
    it('can wait on a single response using "alias"', function () {
      cy.route2('/foo', 'bar')
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

      cy.route2('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can wait on a single response using "alias.response"', function () {
      cy.route2('/foo', 'bar')
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

      cy.route2('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
      })
      .wait('@foo.bar.response', { timeout: 100 })
    })

    it('can wait on a single request using "alias.request"', function () {
      cy.route2('/foo')
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

      cy.route2('/foo')
      .as('foo.bar')
      .wait('@foo.bar.request', { timeout: 100 })
    })

    it('can incrementally wait on responses', function () {
      cy.route2('/foo', 'bar')
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

      cy.route2('/foo', () => new Promise(_.noop))
      .as('foo.bar')
      .then(() => {
        $.get('/foo')
        $.get('/foo')
      })
      .wait('@foo.bar', { timeout: 100 })
      .wait('@foo.bar', { timeout: 100 })
    })

    it('can incrementally wait on requests', function () {
      cy.route2('/foo', (req) => {
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

      cy.route2('/foo', (req) => {
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
      cy.route2(/fixtures\/app/).as('getFoo').then(function () {
        $.get('/fixtures/app.json')
      }).wait('@getFoo').then(function (res) {
        const log = cy.queue.logs({
          displayName: 'req',
        })[0]

        expect(log.get('alias')).to.eq('getFoo')

        expect(JSON.parse(res.response.body as string)).to.deep.eq({
          some: 'json',
          foo: {
            bar: 'baz',
          },
        })
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8695
    context('yields request', function () {
      it('when not intercepted', function () {
        cy.route2('/post-only').as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'some body')
      })

      it('when intercepted', function () {
        cy.route2('/post-only', (req) => {
          req.body = 'changed'
        }).as('foo')
        .then(() => {
          $.post('/post-only', 'some body')
        }).wait('@foo').its('request.body').should('eq', 'changed')
      })
    })

    // @see https://github.com/cypress-io/cypress/issues/8536
    context('yields response', function () {
      const testResponse = (expectedBody, done) => {
        return () => {
          $.get('/xml')

          cy.wait('@foo').then((request) => {
            expect(request.response.body).to.eq(expectedBody)
            done()
          })
        }
      }

      it('when not stubbed', function (done) {
        cy.route2('/xml').as('foo')
        .then(testResponse('<foo>bar</foo>', done))
      })

      it('when stubbed with StaticResponse', function (done) {
        cy.route2('/xml', 'something different')
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with req.reply', function (done) {
        cy.route2('/xml', (req) => req.reply('something different'))
        .as('foo')
        .then(testResponse('something different', done))
      })

      it('when stubbed with res.send', function (done) {
        cy.route2('/xml', (req) => req.reply((res) => res.send('something different')))
        .as('foo')
        .then(testResponse('something different', done))
      })
    })

    // NOTE: was undocumented in cy.route2, may not continue to support
    // @see https://github.com/cypress-io/cypress/issues/7663
    context.skip('indexed aliases', function () {
      it('can wait for things that do not make sense but are technically true', function () {
        cy.route2('/foo')
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar.1')
        .wait('@foo.bar.1') // still only asserting on the 1st response
        .wait('@foo.bar.request') // now waiting for the next request
      })

      it('can wait on the 3rd request using "alias.3"', function () {
        cy.route2('/foo')
        .as('foo.bar')
        .then(() => {
          _.times(3, () => {
            $.get('/foo')
          })
        })
        .wait('@foo.bar.3')
      })

      it('can timeout waiting on the 3rd request using "alias.3"', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('No response ever occurred.')
          done()
        })

        cy.route2('/foo')
        .as('foo.bar')
        .then(() => {
          _.times(2, () => {
            $.get('/foo')
          })
        })
        .wait('@foo.bar.3', { timeout: 100 })
      })
    })
  })
})
