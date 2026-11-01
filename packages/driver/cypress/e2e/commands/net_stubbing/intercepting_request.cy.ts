import { testFail, uniqueRoute, usesBrowserNetworkPath } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
  })

  context('intercepting request', function () {
    it('receives the original request in handler', function (done) {
      cy.intercept('/def456*', function (req) {
        req.reply({
          statusCode: 404,
        })

        expect(req).to.include({
          method: 'GET',
        })

        // NOTE: accepted MITM → CDP drift (#34562): proxy-off there is no browser→proxy
        // hop to report, and the protocol negotiated with the origin is not knowable
        // while the request is paused, so httpVersion is honestly absent.
        if (usesBrowserNetworkPath) {
          expect(req.httpVersion).to.be.undefined
        } else {
          expect(req.httpVersion).to.eq('1.1')
        }

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

    it('receives a binary request body in handler as bytes', function () {
      const bytes = new Uint8Array(4096)

      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = (i * 7 + 0x80) & 0xff
      }

      let seen

      cy.intercept('POST', '/upload', (req) => {
        seen = req.body
      }).as('upload')

      cy.window().then((win) => {
        return win.fetch('/upload', { method: 'POST', body: new Blob([bytes]) })
      })

      cy.wait('@upload')

      cy.then(() => {
        expect(seen).to.be.an('ArrayBuffer')
        expect(new Uint8Array(seen)).to.deep.eq(bytes)
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

    it('can modify a request body to bytes that are not valid utf8', function () {
      // 0x9b is a continuation byte with no lead and 0xfe never appears in
      // utf8, so a string round trip would replace both
      const modified = new Uint8Array([0x9b, 0xfe, 0x41])

      cy.intercept('/binary*', function (req) {
        req.body = modified.buffer
      }).as('post')
      .visit('/fixtures/dump-binary.html')
      .wait('@post')
      // #result is what the origin echoed back, so this asserts the wire
      .get('#result').should('have.text', modified.join(', '))
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

    // https://github.com/cypress-io/cypress/issues/25767
    it('can set a request header to an empty string', function () {
      cy.intercept('/dump-headers*', function (req) {
        req.headers['foo'] = ''
      }).as('get')
      .then(() => {
        return $.get('/dump-headers')
      })
      // the server received the header with an empty value rather than it being dropped
      .should('include', '"foo":""')
      .wait('@get')
      .its('request.headers')
      .should('have.property', 'foo', '')
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
          expect(Date.now() - this.start).to.be.gte(expectedSeconds * 1000 - 50)
          expect(responseText).to.eq(payload)

          done()
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
        // tslint:disable:no-floating-promises
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
              // @ts-expect-error - `eventName` is a string, not one of the request event names
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
            // @ts-expect-error - deliberately passes an unknown event name
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
            // @ts-expect-error - deliberately passes a non-function handler
            req.on('before:response', false)
          }).visit(url)
        })
      })
    })

    context('body parsing', function () {
      // `/post-only` is shared by other tests here, including one that fires a `GET /post-only`
      [
        ['application/json', '{"foo":"bar"}'],
        ['application/vnd.api+json', '{}'],
      ].forEach(([contentType, expectedBody]) => {
        it(`automatically parses ${contentType} request bodies`, function () {
          const p = Promise.defer()

          cy.intercept({ method: 'POST', url: '/post-only' }, (req) => {
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

        cy.intercept({ method: 'POST', url: '/post-only' }, (req) => {
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

        cy.intercept({ method: 'POST', url: '/post-only*' }, (req) => {
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
  })
})
