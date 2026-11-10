import { uniqueRoute } from './helpers'

// TODO: fix flaky tests https://github.com/cypress-io/cypress/issues/23434
describe('network stubbing', { retries: 15 }, function () {
  const { $, _, Promise } = Cypress

  beforeEach(function () {
    // Starting in Electron 28, we cannot use fetch or XHR from within about:blank. This is a workaround
    // to ensure that we have a valid origin for our tests.
    cy.visit('/fixtures/empty.html')
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

    it('can stub a response with a network error', function (done) {
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
})
