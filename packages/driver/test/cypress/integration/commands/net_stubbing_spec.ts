const { $, _, sinon, state } = Cypress

describe('src/cy/commands/net_stubbing', function () {
  context('#route', function () {
    context('creating', function () {
      beforeEach(function () {
        // we don't use cy.spy() because it causes an infinite loop with logging events
        this.sandbox = sinon.createSandbox()
        this.emit = this.sandbox.spy(Cypress, 'emit').withArgs('backend:request', 'net', 'route:added')

        this.testRoute = function (options, handler, expectedEvent, expectedRoute) {
          cy.route(options, handler).then(function () {
            const handlerId = _.findKey(state('routes'), { handler })
            const route = state('routes')[handlerId]

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
              'Accept-Language': {
                type: 'regex',
                value: '/hylian/i',
              },
              'Content-Encoding': {
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
        }

        const expectedRoute = {
          options,
          handler,
        }

        this.testRoute(options, handler, expectedEvent, expectedRoute)
      })

      context('errors', function () {
        beforeEach(function () {
          this.logs = []

          cy.on('log:added', (attrs, log) => {
            this.lastLog = log
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
              cy.route('/', handler)
            })
          })
        })

        context('with invalid StaticResponse', function () {
          [
            [
              'destroySocket set but not alone',
              {
                destroySocket: true,
                body: 'aaa',
              },
              'must be the only option',
            ],
            [
              'body set to an object',
              {
                body: {
                  a: 'b',
                },
              },
              'must be a string',
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
              cy.route('/', handler)
            })
          })
        })
      })
    })

    context('stubbing with static responses', function () {
      it('can stub a response with static body as string', function (done) {
        cy.route({
          url: '*',
        }, 'hello world').then(() => {
          const xhr = new XMLHttpRequest

          xhr.open('GET', '/abc123')
          xhr.send()

          xhr.onload = () => {
            expect(xhr.status).to.eq(200)
            expect(xhr.responseText).to.eq('hello world')

            done()
          }
        })
      })

      it('can stub a cy.visit with static body', function () {
        cy.route('/foo', '<html>hello cruel world</html>').visit('/foo').document().should('contain.text', 'hello cruel world')
      })

      it('can stub a response with an empty StaticResponse', function (done) {
        cy.route('/', {}).then(() => {
          const xhr = new XMLHttpRequest

          xhr.open('GET', '/')
          xhr.send()

          xhr.onload = () => {
            expect(xhr.status).to.eq(200)
            expect(xhr.responseText).to.eq('')

            done()
          }
        })
      })

      it('can stub a response with a network error', function (done) {
        cy.route('/', {
          destroySocket: true,
        }).then(() => {
          const xhr = new XMLHttpRequest

          xhr.open('GET', '/')
          xhr.send()

          xhr.onerror = () => {
            expect(xhr.readyState).to.eq(4)
            expect(xhr.status).to.eq(0)

            done()
          }
        })
      })
    })

    context('stubbing with dynamic response', function () {
      it('receives the original request in handler', function (done) {
        cy.route('/def456', function (req) {
          req.reply({
            statusCode: 404,
          })

          expect(req).to.include({
            url: 'http://localhost:3500/def456',
            method: 'GET',
            httpVersion: '1.1',
          })

          done()
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/def456')

          xhr.send()
        })
      })
    })

    context('intercepting request', function () {
      it('receives the original request body in handler', function (done) {
        cy.route('/aaa', function (req) {
          expect(req.body).to.eq('foo-bar-baz')

          done()
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/aaa')

          xhr.send('foo-bar-baz')
        })
      })

      it('can modify original request body and have it passed to next handler', function (done) {
        cy.route('/post-only', function (req, next) {
          expect(req.body).to.eq('foo-bar-baz')
          req.body = 'quuz'

          next()
        }).then(function () {
          cy.route('/post-only', function (req, next) {
            expect(req.body).to.eq('quuz')
            req.body = 'quux'

            next()
          })
        }).then(function () {
          cy.route('/post-only', function (req) {
            expect(req.body).to.eq('quux')

            done()
          })
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/post-only')

          xhr.send('foo-bar-baz')
        })
      })

      it('can modify a cy.visit before it goes out', function () {
        cy.route('/dump-headers', function (req) {
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
        cy.route('/does-not-exist', function (req) {
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
        cy.route('/dump-method', function (req) {
          expect(req.method).to.eq('POST')

          req.method = 'PATCH'
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/dump-method')
          xhr.send()

          xhr.onload = () => {
            expect(xhr.responseText).to.contain('request method: PATCH')

            done()
          }
        })
      })

      it('can modify the request body', function (done) {
        const body = '{"foo":"bar"}'

        cy.route('/post-only', function (req) {
          expect(req.body).to.eq('quuz')
          req.headers['content-type'] = 'application/json'

          req.body = body
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/post-only')
          xhr.send('quuz')

          xhr.onload = () => {
            expect(xhr.responseText).to.contain(body)

            done()
          }
        })
      })

      it('can add a body to a request that does not have one', function (done) {
        const body = '{"foo":"bar"}'

        cy.route('/post-only', function (req) {
          expect(req.body).to.eq('')
          expect(req.method).to.eq('GET')
          req.method = 'POST'
          req.headers['content-type'] = 'application/json'

          req.body = body
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/post-only')
          xhr.send()

          xhr.onload = () => {
            expect(xhr.responseText).to.contain(body)

            done()
          }
        })
      })

      context('request handler chaining', function () {
        it('passes request through in order using next()', function () {
          cy.route('/dump-method', function (req, next) {
            expect(req.method).to.eq('GET')
            req.method = 'POST'

            next()
          }).route('/dump-method', function (req, next) {
            expect(req.method).to.eq('POST')
            req.method = 'PATCH'

            next()
          }).route('/dump-method', function (req) {
            expect(req.method).to.eq('PATCH')

            req.reply()
          }).visit('/dump-method').contains('PATCH')
        })

        it('stops passing request through once req.reply called', function () {
          cy.route('/dump-method', function (req, next) {
            expect(req.method).to.eq('GET')
            req.method = 'POST'

            next()
          }).route('/dump-method', function (req) {
            expect(req.method).to.eq('POST')

            req.reply()
          }).visit('/dump-method').contains('POST')
        })
      })

      context('errors + warnings', function () {
        it('warns if req.reply is called twice in req handler', function (done) {
          cy.spy(Cypress.utils, 'warnByPath')

          cy.route('/dump-method', function (req) {
            req.reply()

            req.reply()
          }).visit('/dump-method').then(() => {
            expect(Cypress.utils.warnByPath).to.be.calledOnce
            expect(Cypress.utils.warnByPath).to.be.calledWithMatch('net_stubbing.warn_multiple_reply_calls', {
              args: {
                route: {
                  'url': '/dump-method',
                },
                req: Cypress.sinon.match.any,
              },
            })

            done()
          })
        })

        it('warns if next is called twice in req handler', function (done) {
          cy.spy(Cypress.utils, 'warnByPath')

          cy.route('/dump-method', function (req, next) {
            next()

            next()
          }).then(() => {
            const xhr = new XMLHttpRequest

            xhr.open('GET', '/dump-method')
            xhr.send()

            xhr.onload = () => {
              expect(Cypress.utils.warnByPath).to.be.calledOnce
              expect(Cypress.utils.warnByPath).to.be.calledWithMatch('net_stubbing.warn_multiple_next_calls', {
                args: {
                  route: {
                    'url': '/dump-method',
                  },
                  req: Cypress.sinon.match.any,
                },
              })

              done()
            }
          })
        })

        it('warns if next is called after req.reply in req handler', function (done) {
          cy.spy(Cypress.utils, 'warnByPath')

          cy.route('/dump-method', function (req, next) {
            req.reply()

            next()
          }).then(() => {
            const xhr = new XMLHttpRequest

            xhr.open('GET', '/dump-method')
            xhr.send()

            xhr.onload = () => {
              expect(Cypress.utils.warnByPath).to.be.calledOnce
              expect(Cypress.utils.warnByPath).to.be.calledWithMatch('net_stubbing.warn_next_called_after_reply', {
                args: {
                  route: {
                    'url': '/dump-method',
                  },
                  req: Cypress.sinon.match.any,
                },
              })

              done()
            }
          })
        })

        it('warns if req.reply is called after next in req handler', function (done) {
          cy.spy(Cypress.utils, 'warnByPath')

          cy.route('/dump-method', function (req, next) {
            next()

            req.reply()
          }).then(() => {
            const xhr = new XMLHttpRequest

            xhr.open('GET', '/dump-method')
            xhr.send()

            xhr.onload = () => {
              expect(Cypress.utils.warnByPath).to.be.calledOnce
              expect(Cypress.utils.warnByPath).to.be.calledWithMatch('net_stubbing.warn_reply_called_after_next', {
                args: {
                  route: {
                    'url': '/dump-method',
                  },
                  req: Cypress.sinon.match.any,
                },
              })

              done()
            }
          })
        })
      })
    })

    context('intercepting response', function () {
      it('receives the original response in handler', function (done) {
        cy.route('/json-content-type', function (req) {
          req.reply(function (res) {
            expect(res.body).to.eq('{}')

            done()
          })

          expect(req).to.include({
            url: 'http://localhost:3500/json-content-type',
          })
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/json-content-type')

          xhr.send()
        })
      })

      it('can intercept a large proxy response', function (done) {
        cy.route('/1mb', (req) => {
          req.reply((res) => {
            res.send()
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/1mb')
          xhr.send()

          xhr.onload = () => {
            //# TODO: if this fails, browser totally locks up :S
            expect(xhr.responseText).to.eq('X'.repeat(1024 * 1024))

            done()
          }
        })
      })

      it('can delay a proxy response using res.delay', function (done) {
        cy.route('/timeout', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            res.delay(1000).send('delay worked')
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/timeout')
          xhr.send()

          xhr.onload = () => {
            expect(Date.now() - this.start).to.be.closeTo(1000, 100)
            expect(xhr.responseText).to.eq('delay worked')

            done()
          }
        })
      })

      it('can \'delay\' a proxy response using setTimeout', function (done) {
        cy.route('/timeout', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            setTimeout(() => {
              res.send('setTimeout worked')
            }, 1000)
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/timeout')
          xhr.send()

          xhr.onload = () => {
            expect(Date.now() - this.start).to.be.closeTo(1000, 100)
            expect(xhr.responseText).to.eq('setTimeout worked')

            done()
          }
        })
      })

      it('can throttle a proxy response using res.throttle', function (done) {
        cy.route('/1mb', (req) => {
          // don't let gzip make response smaller and throw off the timing
          delete req.headers['accept-encoding']

          req.reply((res) => {
            this.start = Date.now()

            res.throttle(1024).send()
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/1mb')
          xhr.send()

          xhr.onload = () => {
            // 1MB @ 1MB/s = ~1 second
            expect(Date.now() - this.start).to.be.closeTo(1000, 250)
            expect(xhr.responseText).to.eq('X'.repeat(1024 * 1024))

            done()
          }
        })
      })

      it('can throttle a static response using res.throttle', function (done) {
        const payload = 'A'.repeat(10 * 1024)
        const kbps = 10
        const expectedSeconds = payload.length / (1024 * kbps)

        cy.route('/timeout', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            res.throttle(kbps).send(payload)
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/timeout')
          xhr.send()

          xhr.onload = () => {
            expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000, 250)
            expect(xhr.responseText).to.eq(payload)

            done()
          }
        })
      })

      it('can delay and throttle a static response', function (done) {
        const payload = 'A'.repeat(10 * 1024)
        const kbps = 20
        let expectedSeconds = payload.length / (1024 * kbps)
        const delayMs = 500

        expectedSeconds += delayMs / 1000

        cy.route('/timeout', (req) => {
          req.reply((res) => {
            this.start = Date.now()

            res.throttle(kbps).delay(delayMs).send({
              statusCode: 200,
              body: payload,
            })
          })
        }).then(() => {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', '/timeout')
          xhr.send()

          xhr.onload = () => {
            expect(Date.now() - this.start).to.be.closeTo(expectedSeconds * 1000, 100)
            expect(xhr.responseText).to.eq(payload)

            done()
          }
        })
      })

      context('errors + warnings', function () {
        it('warns if res.send is called twice in req handler', function (done) {
          cy.spy(Cypress.utils, 'warnByPath')

          cy.route('/dump-method', function (req) {
            req.reply(function (res) {
              res.send()

              res.send()
            })
          }).visit('/dump-method').then(() => {
            expect(Cypress.utils.warnByPath).to.be.calledOnce
            expect(Cypress.utils.warnByPath).to.be.calledWithMatch('net_stubbing.warn_multiple_send_calls')

            done()
          })
        })
      })
    })

    context('intercepting response errors', function () {
      it('sends an error object to handler if host DNE', function (done) {
        cy.route('/should-err', function (req) {
          req.reply(function (res) {
            expect(res.error).to.include({
              code: 'ECONNREFUSED',
              port: 3333,
            })

            expect(res.url).to.eq('http://localhost:3333/should-err')

            done()
          })
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', 'http://localhost:3333/should-err')

          xhr.send()
        })
      })

      // TODO: fix once certain about API design
      it.skip('can send a successful response even if an error occurs', function (done) {
        cy.route('/should-err', function (req) {
          req.reply(function (res) {
            //# TODO: better API for this?
            expect(res.error).to.exist

            res.send({
              statusCode: 200,
              headers: {
                'access-control-allow-origin': '*',
              },
              body: 'everything is fine',
            })
          })
        }).then(function () {
          const xhr = new XMLHttpRequest()

          xhr.open('GET', 'http://localhost:3333/should-err')
          xhr.send()

          xhr.onload = () => {
            expect(xhr.responseText).to.eq('everything is fine')
            expect(xhr.status).to.eq(200)

            done()
          }
        })
      })
    })

    context('waiting and aliasing', function () {
      it('can wait on a single response using "alias"', function () {
        cy.route('/foo')
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

        cy.route('/foo')
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar.3', { timeout: 100 })
      })

      it('can wait on a single response using "alias.response"', function () {
        cy.route('/foo')
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

        cy.route('/foo', _.noop)
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar.response', { timeout: 100 })
      })

      it('can wait on a single request using "alias.request"', function () {
        cy.route('/foo')
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

        cy.route('/foo')
        .as('foo.bar')
        .wait('@foo.bar.request', { timeout: 100 })
      })

      it('can wait on the 3rd request using "alias.request.3"', function () {
        cy.route('/foo')
        .as('foo.bar')
        .then(() => {
          _.times(3, () => {
            $.get('/foo')
          })
        })
        .wait('@foo.bar.3')
      })

      it('can timeout waiting on the 3rd request using "alias.request.3"', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('No response ever occurred.')
          done()
        })

        cy.route('/foo')
        .as('foo.bar')
        .then(() => {
          _.times(2, () => {
            $.get('/foo')
          })
        })
        .wait('@foo.bar.3', { timeout: 100 })
      })

      it('can incrementally wait on responses', function () {
        cy.route('/foo')
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
          expect(err.message).to.contain('for the 2nd response to the route')
          done()
        })

        cy.route('/foo')
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar')
        .wait('@foo.bar', { timeout: 100 })
      })

      it('can incrementally wait on requests', function () {
        cy.route('/foo', (req) => {
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

      // TODO: erring
      it.skip('can timeout incrementally waiting on requests', function (done) {
        cy.on('fail', (err) => {
          expect(err.message).to.contain('for the 2nd request to the route')
          done()
        })

        cy.route('/foo', (req) => {
          req.reply(_.noop) // only request will be received, no response
        })
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar.request')
        .wait('@foo.bar.request', { timeout: 100 })
      })

      // TODO: the ordinals here are off
      it.skip('can wait for things that do not make sense but are technically true', function () {
        cy.route('/foo')
        .as('foo.bar')
        .then(() => {
          $.get('/foo')
        })
        .wait('@foo.bar.1')
        .wait('@foo.bar.1') // still only asserting on the 1st response
        .wait('@foo.bar.request') // now waiting for the next request
      })

      context('errors', function () {

      })
    })
  })
})
