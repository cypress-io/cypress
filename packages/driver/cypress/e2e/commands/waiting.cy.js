const { assertLogLength } = require('../../support/utils')
const { _, Promise } = Cypress
let reqQueue = []

const xhrGet = function (win, url) {
  const xhr = new win.XMLHttpRequest()

  xhr.open('GET', url)

  reqQueue.push(xhr)

  return xhr.send()
}

// keep track of outstanding requests and abort them so
// they do not clog up the browser request queue
beforeEach(() => {
  _.each(reqQueue, (xhr) => xhr.abort())
  reqQueue = []
})

describe('src/cy/commands/waiting', () => {
  context('#wait', () => {
    describe('number argument', () => {
      it('passes delay onto Promise', () => {
        const delay = cy.spy(Promise, 'delay')

        cy.wait(50).then(() => {
          expect(delay).to.be.calledWith(50, 'wait')
        })
      })

      it('does not change the subject', () => {
        cy
        .wrap({})
        .then(function (subject) {
          this.subject = subject
        })
        .wait(10).then(function (subject) {
          expect(subject).to.eq(this.subject)
        })
      })

      it('increases timeout by delta', () => {
        const timeout = cy.spy(cy, 'timeout')

        cy
        .wait(50)
        .then(() => {
          expect(timeout).to.be.calledWith(50, true, 'wait')
        })
      })
    })

    describe('alias argument', () => {
      beforeEach(() => {
        cy.visit('/fixtures/jquery.html')
      })

      it('waits for a route alias to have a response', () => {
        const response = { foo: 'foo' }

        cy
        .intercept('GET', /.*/, response).as('fetch')
        .window().then((win) => {
          xhrGet(win, '/foo')

          return null
        })
        .wait('@fetch.response').then((xhr) => {
          expect(xhr.response.body).to.deep.eq(response)
        })
      })

      it('waits for the route alias to have a request', () => {
        cy.on('command:retry', _.once(() => {
          const win = cy.state('window')

          xhrGet(win, '/users')

          return null
        }))

        cy
        .intercept(/users/, {
          body: {},
          delay: 1000,
        }).as('getUsers')
        .wait('@getUsers.request').then((xhr) => {
          expect(xhr.request.url).to.include('/users')
          expect(xhr.response).to.be.undefined
        })
      })

      it('passes timeout option down to requestTimeout of wait', (done) => {
        cy.on('command:retry', (options) => {
          expect(options.timeout).to.eq(900)

          done()
        })

        cy
        .intercept('GET', /.*/, {}).as('fetch')
        .wait('@fetch', { timeout: 900 })
      })

      it('resets the timeout after waiting', () => {
        const prevTimeout = cy.timeout()

        const retry = _.after(3, _.once(() => {
          cy.state('window').$.get('/foo')
        }))

        cy.on('command:retry', retry)

        cy
        .intercept('GET', /.*/, {}).as('fetch')
        .wait('@fetch').then(() => {
          expect(cy.timeout()).to.eq(prevTimeout)
        })
      })

      it('waits for requestTimeout', {
        requestTimeout: 199,
      }, (done) => {
        cy.on('command:retry', (options) => {
          expect(options.timeout).to.eq(199)

          done()
        })

        cy
        .intercept('GET', '*', {}).as('fetch')
        .wait('@fetch').then(() => {
          expect(cy.timeout()).to.eq(199)
        })
      })

      it('waits for requestTimeout override', (done) => {
        cy.on('command:retry', (options) => {
          expect(options.type).to.eq('request')
          expect(options.timeout).to.eq(199)

          done()
        })

        cy
        .intercept('GET', '*', {}).as('fetch')
        .wait('@fetch', { requestTimeout: 199 })
      })

      it('waits for responseTimeout', {
        responseTimeout: 299,
      }, (done) => {
        cy.on('command:retry', (options) => {
          if (options.type === 'response') {
            expect(options.timeout).to.eq(299)

            done()
          }
        })

        cy
        .intercept('GET', '*', {
          body: {},
          delay: 100,
        }).as('fetch')
        .window().then((win) => {
          xhrGet(win, '/foo')

          return null
        })
        .wait('@fetch')
      })

      it('waits for responseTimeout override', (done) => {
        cy.on('command:retry', (options) => {
          if (options.type === 'response') {
            expect(options.type).to.eq('response')
            expect(options.timeout).to.eq(299)

            done()
          }
        })

        cy
        .intercept('GET', '*', {
          body: {},
          delay: 100,
        }).as('fetch')
        .window().then((win) => {
          xhrGet(win, '/foo')

          return null
        })
        .wait('@fetch', { responseTimeout: 299 })
      })

      it('waits for requestTimeout and responseTimeout override', (done) => {
        let retryCount = 0

        cy.on('command:retry', (options) => {
          retryCount++
          if (retryCount === 1) {
            expect(options.type).to.eq('request')
            expect(options.timeout).to.eq(1000)

            // trigger request to move onto response timeout verification
            const win = cy.state('window')

            xhrGet(win, '/foo')
          }

          if (options.type === 'response') {
            expect(options.type).to.eq('response')
            expect(options.timeout).to.eq(1001)

            done()
          }
        })

        cy
        .intercept('GET', '*', {
          body: {},
          delay: 100,
        }).as('fetch')
        .wait('@fetch', { requestTimeout: 1000, responseTimeout: 1001 })
      })

      // https://github.com/cypress-io/cypress/issues/369
      it('does not mutate 2nd route methods when using shorthand route', () => {
        cy
        .intercept('POST', /foo/, {}).as('getFoo')
        .intercept(/bar/, {}).as('getBar')
        .window().then((win) => {
          win.$.post('/foo')
          xhrGet(win, '/bar')

          return null
        })
        .wait('@getBar')
      })

      describe('errors', {
        defaultCommandTimeout: 100,
      }, () => {
        it('throws when alias does not match a route (DOM element)', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` only accepts aliases for routes.\nThe alias: `b` did not match a route.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy.get('body').as('b').wait('@b')
        })

        it('throws when alias does not match a route (wrapped value)', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` only accepts aliases for routes.\nThe alias: `b` did not match a route.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy.wrap('my value').as('b').wait('@b')
        })

        it('throws when route is never resolved', {
          requestTimeout: 100,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `fetch`. No request ever occurred.')

            done()
          })

          cy.intercept('GET', /.*/, {}).as('fetch')
          cy.wait('@fetch')
        })

        it('throws when alias is never requested', {
          requestTimeout: 100,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred.')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .wait('@foo.request')
        })

        it('throws when alias is missing \'@\' but matches an available alias', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('Invalid alias: `getAny`.\nYou forgot the `@`. It should be written as: `@getAny`.')

            done()
          })

          cy
          .intercept('*', {}).as('getAny')
          .wait('getAny').then(() => {})
        })

        it('throws when 2nd alias doesn\'t match any registered alias', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.wait()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait(['@foo', '@bar'])
        })

        it('throws when 2nd alias is missing \'@\' but matches an available alias', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`.')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .intercept(/bar/, {}).as('bar')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait(['@foo', 'bar'])
        })

        it('throws when 2nd alias isn\'t a route alias', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .get('body').as('bar')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait(['@foo', '@bar'])
        })

        it('throws whenever an alias times out', {
          requestTimeout: 1000,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `1000ms` for the 1st request to the route: `foo`. No request ever occurred.')

            done()
          })

          cy.on('command:retry', (options) => {
            // force foo to time out before bar
            if (/foo/.test(options.error)) {
              options._runnableTimeout = 0
            }
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .intercept(/bar/, {}).as('bar')
          .wait(['@foo', '@bar'])
        })

        it('throws when bar cannot resolve', {
          requestTimeout: 100,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `bar`. No request ever occurred.')

            done()
          })

          cy.on('command:retry', _.once(() => {
            const win = cy.state('window')

            xhrGet(win, '/foo')

            return null
          }))

          cy
          .intercept(/foo/, { foo: 'foo' }).as('foo')
          .intercept(/bar/, { bar: 'bar' }).as('bar')
          .wait(['@foo', '@bar'])
        })

        it('throws when foo cannot resolve', {
          requestTimeout: 100,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred.')

            done()
          })

          cy.on('command:retry', _.once(() => {
            const win = cy.state('window')

            xhrGet(win, '/bar')

            return null
          }))

          cy
          .intercept(/foo/, { foo: 'foo' }).as('foo')
          .intercept(/bar/, { bar: 'bar' }).as('bar')
          .wait(['@foo', '@bar'])
        })

        it('does not throw another timeout error when 2nd alias is missing @', {
          requestTimeout: 100,
        }, (done) => {
          Promise.onPossiblyUnhandledRejection(done)

          cy.on('fail', (err) => {
            expect(err.message).to.eq('Invalid alias: `bar`.\nYou forgot the `@`. It should be written as: `@bar`.')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .intercept(/bar/, {}).as('bar')
          .wait(['@foo', 'bar'])
        })

        it('does not throw again when 2nd alias doesn\'t reference a route', {
          requestTimeout: 100,
        }, (done) => {
          Promise.onPossiblyUnhandledRejection(done)

          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy
          .intercept(/foo/, {}).as('foo')
          .get('body').as('bar')
          .wait(['@foo', '@bar'])
        })

        it('does not retry after 1 alias times out', {
          requestTimeout: 1000,
        }, (done) => {
          Promise.onPossiblyUnhandledRejection(done)

          cy.on('command:retry', (options) => {
            // force bar to time out before foo
            if (/bar/.test(options.error)) {
              options._runnableTimeout = 0
            }
          })

          cy.on('fail', (err) => {
            done()
          })

          cy
          .intercept(/foo/, { foo: 'foo' }).as('foo')
          .intercept(/bar/, { bar: 'bar' }).as('bar')
          .wait(['@foo', '@bar'])
        })

        it('throws waiting for the 3rd response', {
          requestTimeout: 200,
        }, (done) => {
          const resp = { foo: 'foo' }
          let response = 0

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 3rd request to the route: `get.users`. No request ever occurred.')

            done()
          })

          cy.on('command:retry', () => {
            response += 1

            // dont send the 3rd response
            if (response === 3) {
              return cy.removeAllListeners('command:retry')
            }

            const win = cy.state('window')

            return xhrGet(win, `/users?num=${response}`)
          })

          cy.intercept(/users/, resp).as('get.users')
          cy.wait(['@get.users', '@get.users', '@get.users'])
        })

        it('throws waiting for the 2nd response', {
          requestTimeout: 200,
        }, (done) => {
          const resp = { foo: 'foo' }
          let response = 0

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.')

            done()
          })

          // dont send the 2nd response
          cy.on('command:retry', _.once(() => {
            response += 1
            const win = cy.state('window')

            return xhrGet(win, `/users?num=${response}`)
          }))

          cy
          .intercept(/users/, resp).as('getUsers')
          .wait('@getUsers')
          .wait('@getUsers')
        })

        it('throws waiting for the 2nd request', {
          requestTimeout: 200,
        }, (done) => {
          const resp = { foo: 'foo' }
          let request = 0

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.')

            done()
          })

          // dont send the 2nd request
          cy.on('command:retry', _.once(() => {
            request += 1
            const win = cy.state('window')

            return xhrGet(win, `/users?num=${request}`)
          }))

          cy
          .intercept(/users/, resp).as('getUsers')
          .wait('@getUsers.request')
          .wait('@getUsers.request')
        })

        it('throws when waiting for response to route', {
          responseTimeout: 100,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st response to the route: `response`. No response ever occurred.')

            done()
          })

          cy
          .intercept('*').as('response')
          .window().then((win) => {
            xhrGet(win, '/timeout?ms=500')

            return null
          })
          .wait('@response')
        })

        it('throws when waiting for 2nd response to route', {
          responseTimeout: 200,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 2nd response to the route: `response`. No response ever occurred.')

            done()
          })

          cy
          .intercept('*').as('response')
          .window().then((win) => {
            xhrGet(win, '/timeout?ms=0')
            xhrGet(win, '/timeout?ms=5000')

            return null
          })
          .wait(['@response', '@response'])
        })

        it('throws when waiting for 1st response to bar', {
          responseTimeout: 200,
        }, (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 1st response to the route: `bar`. No response ever occurred.')

            done()
          })

          cy
          .intercept('/timeout?ms=0').as('foo')
          .intercept('/timeout?ms=5000').as('bar')
          .window().then((win) => {
            xhrGet(win, '/timeout?ms=0')
            xhrGet(win, '/timeout?ms=5000')

            return null
          })
          .wait(['@foo', '@bar'])
        })

        it('throws when waiting on the 2nd request', {
          requestTimeout: 200,
        }, (done) => {
          cy.on('command:retry', _.once(() => {
            const win = cy.state('window')

            xhrGet(win, '/users')

            return null
          }))

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `200ms` for the 2nd request to the route: `getUsers`. No request ever occurred.')

            done()
          })

          cy
          .intercept(/users/, {
            body: {},
            delay: 200,
          }).as('getUsers')
          .wait('@getUsers.request').then((xhr) => {
            expect(xhr.request.url).to.include('/users')
            expect(xhr.response).to.be.undefined
          })
          .wait('@getUsers')
        })

        it('throws when waiting on the 3rd request on array of aliases', {
          requestTimeout: 500,
          responseTimeout: 10000,
        }, (done) => {
          cy.on('command:retry', _.once(() => {
            const win = cy.state('window')

            _.defer(() => {
              xhrGet(win, '/timeout?ms=2001')
            })

            _.defer(() => {
              xhrGet(win, '/timeout?ms=2002')
            })
          }))

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `500ms` for the 1st request to the route: `get.three`. No request ever occurred.')

            done()
          })

          cy.intercept('/timeout?ms=2001').as('getOne')
          cy.intercept('/timeout?ms=2002').as('getTwo')
          cy.intercept(/three/, {}).as('get.three')
          cy.wait(['@getOne', '@getTwo', '@get.three'])
        })

        it('throws when waiting on the 3rd response on array of aliases', {
          requestTimeout: 200,
          responseTimeout: 1000,
        }, (done) => {
          const win = cy.state('window')

          cy.on('command:retry', (options) => {
            if (/getThree/.test(options.error) && options.type === 'response') {
              options._runnableTimeout = 0
            }
          })

          cy.on('fail', (err) => {
            expect(err.message).to.include('`cy.wait()` timed out waiting `1000ms` for the 1st response to the route: `getThree`. No response ever occurred.')

            done()
          })

          cy
          .intercept('/timeout?ms=1').as('getOne')
          .intercept('/timeout?ms=2').as('getTwo')
          .intercept('/timeout?ms=3000').as('getThree')
          .then(() => {
            xhrGet(win, '/timeout?ms=1')
            xhrGet(win, '/timeout?ms=2')
            xhrGet(win, '/timeout?ms=3000')

            return null
          }).wait(['@getOne', '@getTwo', '@getThree'])
        })

        it('throws when passed multiple string arguments', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.wait()` was passed invalid arguments. You cannot pass multiple strings. If you\'re trying to wait for multiple routes, use an array.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy.wait('@foo', '@bar')
        })

        it('throws when passed callback function', (done) => {
          cy.on('fail', (err) => {
            expect(err.message).to.eq('`cy.wait()` was passed invalid arguments. You cannot pass a function. If you would like to wait on the result of a `cy.wait()`, use `cy.then()`.')
            expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

            done()
          })

          cy.wait('@foo', () => {})
        })
      })
    })

    describe('multiple alias arguments', () => {
      beforeEach(() => {
        cy.visit('/fixtures/jquery.html')
      })

      it('can wait for all requests to have a response', () => {
        const resp1 = { foo: 'foo' }
        const resp2 = { bar: 'bar' }

        cy.intercept(/users/, resp1).as('getUsers')
        cy.intercept(/posts/, resp2).as('get.posts')
        cy.window().then((win) => {
          xhrGet(win, '/users')
          xhrGet(win, '/posts')

          return null
        })

        cy.wait(['@getUsers', '@get.posts']).spread((xhr1, xhr2) => {
          expect(xhr1.response.body).to.deep.eq(resp1)
          expect(xhr2.response.body).to.deep.eq(resp2)
        })
      })

      it('all responses returned in correct order - unique aliases', () => {
        const resp1 = { value: 'alpha' }
        const resp2 = { value: 'beta' }
        const resp3 = { value: 'gamma' }
        const resp4 = { value: 'delta' }
        const resp5 = { value: 'epsilon' }

        cy.intercept(/alpha/, resp1).as('getAlpha')
        cy.intercept(/beta/, resp2).as('getBeta')
        cy.intercept(/gamma/, resp3).as('getGamma')
        cy.intercept(/delta/, resp4).as('getDelta')
        cy.intercept(/epsilon/, resp5).as('getEpsilon')

        cy.window().then((win) => {
          xhrGet(win, '/epsilon')
          xhrGet(win, '/beta')
          xhrGet(win, '/gamma')
          xhrGet(win, '/delta')
          xhrGet(win, '/alpha')

          return null
        })

        cy.wait(['@getAlpha', '@getBeta', '@getGamma', '@getDelta', '@getEpsilon']).then((responses) => {
          expect(responses[0]?.response?.body.value).to.eq('alpha')
          expect(responses[1]?.response?.body.value).to.eq('beta')
          expect(responses[2]?.response?.body.value).to.eq('gamma')
          expect(responses[3]?.response?.body.value).to.eq('delta')
          expect(responses[4]?.response?.body.value).to.eq('epsilon')
        })
      })

      it('all responses returned in correct order - duplicate aliases', () => {
        let alphaCount = 0
        let betaCount = 0
        let gammaCount = 0

        cy.intercept(/alpha/, (req) => {
          req.reply({ value: `alpha-${alphaCount}` })
          alphaCount++
        }).as('getAlpha')

        cy.intercept(/beta/, (req) => {
          req.reply({ value: `beta-${betaCount}` })
          betaCount++
        }).as('getBeta')

        cy.intercept(/gamma/, (req) => {
          req.reply({ value: `gamma-${gammaCount}` })
          gammaCount++
        }).as('getGamma')

        cy.window().then((win) => {
          xhrGet(win, '/alpha')
          xhrGet(win, '/beta')
          xhrGet(win, '/gamma')
          xhrGet(win, '/alpha')
          xhrGet(win, '/gamma')

          return null
        })

        cy.wait(['@getGamma', '@getBeta', '@getGamma', '@getAlpha', '@getAlpha']).then((responses) => {
          expect(responses[0]?.response?.body.value).to.eq('gamma-0')
          expect(responses[1]?.response?.body.value).to.eq('beta-0')
          expect(responses[2]?.response?.body.value).to.eq('gamma-1')
          expect(responses[3]?.response?.body.value).to.eq('alpha-0')
          expect(responses[4]?.response?.body.value).to.eq('alpha-1')
        })
      })
    })

    describe('multiple separate alias waits', () => {
      beforeEach(() => {
        cy.visit('/fixtures/jquery.html')
      })

      it('waits for a 3rd request before resolving', () => {
        const resp = { foo: 'foo' }
        let response = 0

        const win = cy.state('window')

        cy.on('command:retry', (options) => {
          if (options._retries === 1) {
            response += 1

            return xhrGet(win, `/users?num=${response}`)
          }
        })

        cy
        .intercept(/users/, resp).as('getUsers')
        .wait('@getUsers').then((xhr) => {
          expect(xhr.request.url).to.include('/users?num=1')
          expect(xhr.response.body).to.deep.eq(resp)
        })
        .wait('@getUsers').then((xhr) => {
          expect(xhr.request.url).to.include('/users?num=2')
          expect(xhr.response.body).to.deep.eq(resp)
        })
        .wait('@getUsers').then((xhr) => {
          expect(xhr.request.url).to.include('/users?num=3')
          expect(xhr.response.body).to.deep.eq(resp)
        })
      })

      // FIXME: failing in CI sometimes https://circleci.com/gh/cypress-io/cypress/5655
      it.skip('waits for the 4th request before resolving', () => {
        const resp = { foo: 'foo' }
        let response = 0

        const win = cy.state('window')

        cy.on('command:retry', (options) => {
          // only add a request for the first unique retry
          // for each request
          if (options._retries === 1) {
            response += 1

            return xhrGet(win, `/users?num=${response}`)
          }
        })

        cy
        .intercept(/users/, resp).as('getUsers')
        .wait(['@getUsers', '@getUsers', '@getUsers']).spread((xhr1, xhr2, xhr3) => {
          expect(xhr1.request.url).to.include('/users?num=1')
          expect(xhr2.url).to.include('/users?num=2')

          expect(xhr3.request.url).to.include('/users?num=3')
        }).wait('@getUsers').then((xhr) => {
          expect(xhr.request.url).to.include('/users?num=4')

          expect(xhr.response.body).to.deep.eq(resp)
        })
      })

      return null
    })

    describe('errors', () => {
      describe('invalid 1st argument', {
        defaultCommandTimeout: 50,
      }, () => {
        _.each([
          { type: 'NaN', val: 0 / 0, errVal: 'NaN' },
          { type: 'Infinity', val: Infinity, errVal: 'Infinity' },
          { type: 'Array', val: [] },
          { type: 'null', val: null },
          { type: 'undefined', val: undefined },
          { type: 'Boolean', val: true },
          { type: 'Object', val: {} },
          { type: 'Symbol', val: Symbol.iterator, errVal: 'Symbol(Symbol.iterator)' },
          { type: 'Function', val: () => {}, errVal: 'undefined' },
        ], (attrs) => {
          it(`throws when 1st arg is ${attrs.type}`, (done) => {
            cy.on('fail', (err) => {
              expect(err.message).to.eq(`\`cy.wait()\` only accepts a number, an alias of a route, or an array of aliases of routes. You passed: \`${attrs.errVal || JSON.stringify(attrs.val)}\``)
              expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

              done()
            })

            cy.get('body').wait(attrs.val)
          })
        })
      })
    })

    describe('.log', () => {
      beforeEach(function () {
        this.logs = []

        cy.on('log:added', (attrs, log) => {
          this.lastLog = log
          if (log.get('name') === 'wait') {
            this.lastWaitLog = log
          }

          this.logs.push(log)
        })
      })

      describe('explicit wait time', function () {
        it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
          // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
          // to ensure that we have a valid origin for our tests.
          cy.visit('/fixtures/empty.html')

          cy.on('_log:added', (attrs, log) => {
            this.hiddenLog = log
          })

          cy.wait(10, { log: false }).then(function () {
            const { lastWaitLog, hiddenLog } = this

            expect(lastWaitLog).to.be.undefined
            expect(hiddenLog).to.be.undefined
          })
        })

        it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
          // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
          // to ensure that we have a valid origin for our tests.
          cy.visit('/fixtures/empty.html')

          cy.on('_log:added', (attrs, log) => {
            this.hiddenLog = log
          })

          cy.wait(10, { log: false }).then(function () {
            const { lastWaitLog, hiddenLog } = this

            expect(lastWaitLog).to.be.undefined
            expect(hiddenLog.get('name')).to.eq('wait')
            expect(hiddenLog.get('hidden')).to.be.true
            expect(hiddenLog.get('snapshots').length, 'log snapshot length').to.eq(1)
          })
        })
      })

      describe('wait for xhr', function () {
        it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
          // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
          // to ensure that we have a valid origin for our tests.
          cy.visit('/fixtures/empty.html')

          cy.on('_log:added', (attrs, log) => {
            if (attrs.name === 'wait') {
              this.hiddenWaitLog = log
            }
          })

          const response = { foo: 'foo' }

          cy
          .intercept('GET', /.*/, response).as('fetch')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@fetch.response', { log: false })
          .then(function (xhr) {
            const { lastWaitLog, hiddenWaitLog } = this

            expect(xhr.response.body).to.deep.eq(response)

            expect(lastWaitLog).to.be.undefined
            expect(hiddenWaitLog).to.be.undefined
          })
        })

        it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
          // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
          // to ensure that we have a valid origin for our tests.
          cy.visit('/fixtures/empty.html')

          cy.on('_log:added', (attrs, log) => {
            if (attrs.name === 'wait') {
              this.hiddenWaitLog = log
            }
          })

          const response = { foo: 'foo' }

          cy
          .intercept('GET', /.*/, response).as('fetch')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@fetch.response', { log: false })
          .then(function (xhr) {
            const { lastWaitLog, hiddenWaitLog } = this

            expect(xhr.response.body).to.deep.eq(response)

            expect(lastWaitLog).to.be.undefined
            expect(hiddenWaitLog).to.be.ok
            expect(hiddenWaitLog.get('name')).to.eq('wait')
            expect(hiddenWaitLog.get('hidden')).to.be.true
            expect(hiddenWaitLog.get('snapshots').length, 'log snapshot length').to.eq(1)
          })
        })
      })

      it('can turn off logging for wait for xhr', { protocolEnabled: true }, function () {
        // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
        // to ensure that we have a valid origin for our tests.
        cy.visit('/fixtures/empty.html')

        cy.on('_log:added', (attrs, log) => {
          if (attrs.name === 'wait') {
            this.hiddenWaitLog = log
          }
        })

        const response = { foo: 'foo' }

        cy
        .intercept('GET', /.*/, response).as('fetch')
        .window().then((win) => {
          xhrGet(win, '/foo')

          return null
        })
        .wait('@fetch.response', { log: false })
        .then(function (xhr) {
          const { lastWaitLog, hiddenWaitLog } = this

          expect(xhr.response.body).to.deep.eq(response)

          expect(lastWaitLog).to.be.undefined
          expect(hiddenWaitLog).to.be.ok
          expect(hiddenWaitLog.get('name')).to.eq('wait')
          expect(hiddenWaitLog.get('hidden')).to.be.true
          expect(hiddenWaitLog.get('snapshots').length, 'log snapshot length').to.eq(1)
        })
      })

      describe('number argument', () => {
        it('does not immediately end', () => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'wait') {
              expect(log.get('state')).not.to.eq('passed')
            }
          })

          cy.noop({}).wait(10).then(function () {
            const { lastLog } = this

            expect(lastLog.get('state')).to.eq('passed')
          })
        })

        it('does not immediately snapshot', () => {
          cy.on('log:added', (attrs, log) => {
            if (attrs.name === 'wait') {
              expect(log.get('snapshots')).not.to.be.ok
            }
          })

          cy.noop({}).wait(10).then(function () {
            const { lastLog } = this

            expect(lastLog.get('snapshots').length).to.eq(1)
            expect(lastLog.get('snapshots')[0]).to.be.an('object')
          })
        })

        it('is a type: child if subject', () => {
          cy.noop({}).wait(10).then(function () {
            const { lastLog } = this

            expect(lastLog.get('type')).to.eq('child')
          })
        })

        it('is a type: child if subject is false', () => {
          cy.noop(false).wait(10).then(function () {
            const { lastLog } = this

            expect(lastLog.get('type')).to.eq('child')
          })
        })

        it('is a type: parent if subject is null or undefined', () => {
          cy.wait(10).then(function () {
            const { lastLog } = this

            expect(lastLog.get('type')).to.eq('parent')
          })
        })

        it('#consoleProps', () => {
          cy.wait(10).then(function () {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              name: 'wait',
              type: 'command',
              props: {
                'Waited For': '10ms before continuing',
                'Yielded': undefined,
              },
            })
          })
        })

        it('#consoleProps as a child', () => {
          cy.wrap({}).wait(10).then(function () {
            expect(this.lastLog.invoke('consoleProps')).to.deep.eq({
              name: 'wait',
              type: 'command',
              props: {
                'Waited For': '10ms before continuing',
                'Yielded': {},
              },
            })
          })
        })
      })

      describe('alias argument errors', () => {
        it('.log', {
          requestTimeout: 100,
        }, function (done) {
          cy.on('fail', (err) => {
            const obj = {
              name: 'wait',
              referencesAlias: [{ name: 'getFoo', cardinal: 1, ordinal: '1st' }],
              aliasType: 'route',
              type: 'parent',
              error: err,
              instrument: 'command',
              message: '@getFoo',
            }

            const { lastLog } = this

            _.each(obj, (value, key) => {
              expect(lastLog.get(key)).deep.eq(value, `expected key: ${key} to eq value: ${value}`)
            })

            done()
          })

          cy.intercept(/foo/, {}).as('getFoo')
          cy.noop({}).wait('@getFoo')
        })

        it('only logs once', function (done) {
          cy.on('fail', (err) => {
            assertLogLength(this.logs, 1)
            expect(err.message).to.eq('`cy.wait()` could not find a registered alias for: `@foo`.\nYou have not aliased anything yet.')

            done()
          })

          cy.wait('@foo')
        })

        it('#consoleProps multiple aliases', {
          requestTimeout: 100,
        }, function (done) {
          cy.on('fail', (err) => {
            const { lastWaitLog } = this

            expect(lastWaitLog.get('error')).to.eq(err)
            expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `getBar`. No request ever occurred.')

            done()
          })

          cy.visit('/fixtures/empty.html')

          cy
          .intercept(/foo/, {}).as('getFoo')
          .intercept(/bar/, {}).as('getBar')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait(['@getFoo', '@getBar'])
        })
      })

      describe('alias argument', () => {
        beforeEach(() => {
          cy.visit('/fixtures/empty.html')
        })

        it('is a parent command', () => {
          cy
          .intercept(/foo/, {}).as('getFoo')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@getFoo').then(function () {
            const { lastLog } = this

            expect(lastLog.get('type')).to.eq('parent')
          })
        })

        it('passes as array of referencesAlias', () => {
          cy
          .intercept(/foo/, {}).as('getFoo')
          .intercept(/bar/, {}).as('getBar')
          .window().then((win) => {
            xhrGet(win, '/foo')
            xhrGet(win, '/bar')
            xhrGet(win, '/foo')

            return null
          })
          .wait(['@getFoo', '@getBar', '@getFoo']).then(function (xhrs) {
            const { lastWaitLog } = this

            expect(lastWaitLog.get('referencesAlias')).to.deep.eq([
              {
                name: 'getFoo',
                cardinal: 1,
                ordinal: '1st',
              },
              {
                name: 'getBar',
                cardinal: 1,
                ordinal: '1st',
              },
              {
                name: 'getFoo',
                cardinal: 2,
                ordinal: '2nd',
              },
            ])
          })
        })

        it('#consoleProps waiting on 1 alias', () => {
          cy
          .intercept(/foo/, {}).as('getFoo')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@getFoo').then(function (xhr) {
            expect(this.lastWaitLog.invoke('consoleProps')).to.deep.eq({
              name: 'wait',
              type: 'command',
              props: {
                'Waited For': 'getFoo',
                Yielded: xhr,
              },
            })
          })
        })

        it('#consoleProps waiting on multiple aliases', () => {
          cy
          .intercept(/foo/, {}).as('getFoo')
          .intercept(/bar/, {}).as('getBar')
          .window().then((win) => {
            xhrGet(win, '/foo')
            xhrGet(win, '/bar')

            return null
          })
          .wait(['@getFoo', '@getBar']).then(function (xhrs) {
            expect(this.lastWaitLog.invoke('consoleProps')).to.deep.eq({
              name: 'wait',
              type: 'command',
              props: {
                'Waited For': 'getFoo, getBar',
                Yielded: [xhrs[0], xhrs[1]], // explicitly create the array here
              },
            })
          })
        })
      })

      describe('timeouts', function () {
        beforeEach(() => {
          cy.visit('/fixtures/empty.html')
        })

        it('sets default requestTimeout', {
          requestTimeout: 199,
        }, function (done) {
          cy.on('command:retry', () => {
            expect(this.lastLog.get('timeout')).to.eq(199)

            done()
          })

          cy
          .intercept('GET', '*', {}).as('fetch')
          .wait('@fetch')
        })

        it('sets custom requestTimeout', function (done) {
          cy.on('command:retry', () => {
            expect(this.lastLog.get('timeout')).to.eq(199)

            done()
          })

          cy
          .intercept('GET', '*', {}).as('fetch')
          .wait('@fetch', { requestTimeout: 199 })
        })

        it('sets default responseTimeout', {
          responseTimeout: 299,
        }, function (done) {
          cy.on('command:retry', (command) => {
            if (command.type === 'response') {
              expect(this.lastWaitLog.get('timeout')).to.eq(299)

              done()
            }
          })

          cy
          .intercept('GET', '*', {
            body: {},
            delay: 100,
          }).as('fetch')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@fetch')
        })

        it('sets custom responseTimeout', function (done) {
          cy.on('command:retry', (command) => {
            if (command.type === 'response') {
              expect(this.lastWaitLog.get('timeout')).to.eq(299)

              done()
            }
          })

          cy
          .intercept('GET', '*', {
            body: {},
            delay: 100,
          }).as('fetch')
          .window().then((win) => {
            xhrGet(win, '/foo')

            return null
          })
          .wait('@fetch', { responseTimeout: 299 })
        })

        it('updates to requestTimeout and responseTimeout at the proper times', function (done) {
          let log
          let retryCount = 0

          cy.on('command:retry', (command) => {
            log = log || this.lastWaitLog
            retryCount++
            if (retryCount === 1) {
              expect(log.get('timeout')).to.eq(1000)

              // trigger request to move onto response timeout verification
              const win = cy.state('window')

              xhrGet(win, '/foo')
            }

            if (command.type === 'response') {
              expect(log.get('timeout')).to.eq(1001)

              done()
            }
          })

          cy
          .intercept('GET', '*', {
            body: {},
            delay: 100,
          }).as('fetch')
          .wait('@fetch', { requestTimeout: 1000, responseTimeout: 1001 })
        })
      })
    })
  })
})
