/* eslint-disable no-undef */
describe('xhrs', () => {
  it('can encode + decode headers', () => {
    const getResp = () => {
      return {
        'test': 'We’ll',
      }
    }

    cy.server()
    cy.route(/api/, getResp()).as('getApi')
    cy.visit('/index.html')
    cy.window().then((win) => {
      const xhr = new win.XMLHttpRequest

      xhr.open('GET', '/api/v1/foo/bar?a=42')

      xhr.send()
    })

    cy.wait('@getApi')
    .its('url').should('include', 'api/v1')
  })

  it('ensures that request headers + body go out and reach the server unscathed', () => {
    cy.visit('http://localhost:1919')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('POST', '/login')
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('X-CSRF-Token', 'abc-123')
        xhr.send(JSON.stringify({ foo: 'bar' }))
        xhr.onload = () => {
          return resolve(JSON.parse(xhr.response))
        }
      })
    }).then((resp) => {
    // the server sends us back response JSON
    // with the request details so we can verify
    // that the backend server received exactly what we sent
    // and the Cypress proxy did not modify this in any way
      expect(resp.body).to.deep.eq({ foo: 'bar' })
      expect(resp.headers).to.have.property('x-csrf-token', 'abc-123')

      expect(resp.headers).to.have.property('content-type', 'application/json')
    })
  })

  it('does not inject into json\'s contents from http server even requesting text/html', () => {
    cy.visit('http://localhost:1919')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('POST', '/html')
        xhr.setRequestHeader('Content-Type', 'text/html')
        xhr.setRequestHeader('Accept', 'text/html')
        xhr.send(JSON.stringify({ content: '<html>content</html>' }))
        xhr.onload = () => {
          return resolve(JSON.parse(xhr.response))
        }
      })
    }).then((resp) => {
      // even though our request is requesting text/html
      // the server sends us back json and the proxy will
      // not inject into json
      expect(resp).to.deep.eq({ content: '<html>content</html>' })
    })
  })

  it('does not inject into json\'s contents from file server even requesting text/html', () => {
    cy.visit('/')
    cy.window().then((win) => {
      return new Cypress.Promise((resolve) => {
        const xhr = new win.XMLHttpRequest

        xhr.open('GET', '/static/content.json')
        xhr.setRequestHeader('Content-Type', 'text/html')
        xhr.setRequestHeader('Accept', 'text/html')
        xhr.send()
        xhr.onload = () => {
          return resolve(JSON.parse(xhr.response))
        }
      })
    }).then((resp) => {
      // even though our request is requesting text/html
      // the fil server sends us back json and the proxy will
      // not inject into json
      expect(resp).to.deep.eq({ content: '<html>content</html>' })
    })
  })

  it('works prior to visit', () => {
    cy.server()
  })

  // https://github.com/cypress-io/cypress/issues/5431
  it('can stub a 100kb response', (done) => {
    const body = 'X'.repeat(100 * 1024)

    cy.server()
    cy.route({
      method: 'POST',
      url: '/foo',
      response: {
        'bar': body,
      },
    })

    cy.visit('/index.html')
    .then((win) => {
      const xhr = new win.XMLHttpRequest

      xhr.open('POST', '/foo')
      xhr.send()

      const finish = function () {
        expect(xhr.status).to.eq(200)
        expect(xhr.responseText).to.include(body)

        return done()
      }

      xhr.onload = finish
      xhr.onerror = finish
    })
  })

  it('spawns tasks with original NODE_OPTIONS', () => {
    cy.task('assert:http:max:header:size', 8192)
  })

  describe('server with 1 visit', () => {
    before(() => {
      cy.visit('/xhr.html')
    })

    beforeEach(() => {
      cy.server()
      cy.route(/users/, [{}, {}]).as('getUsers')
    })

    it('response body', () => {
      cy.get('#fetch').click()
      cy.wait('@getUsers').then((xhr) => {
        expect(xhr.url).to.include('/users')

        expect(xhr.responseBody).to.deep.eq([{}, {}])
      })
    })

    it('request body', () => {
      cy.route('POST', /users/, { name: 'b' }).as('createUser')
      cy.get('#create').click()
      cy.wait('@createUser').its('requestBody')
      .should('deep.eq', { some: 'data' })
    })

    it('aborts', () => {
      cy.window()
      .then((win) => {
        cy.route({
          method: 'POST',
          url: /users/,
          response: { name: 'b' },
          delay: 2000,
        }).as('createUser')

        cy.get('#create').click().then(() => {
          return win.location.href = '/index.html'
        })

        cy.wait('@createUser').its('canceled').should('be.true')
      })
    })
  })
})
