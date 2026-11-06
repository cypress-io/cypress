export {}

// the agent's world shares the AUT's origin, so these requests come from the cross-origin AUT
const fetchInAut = (...urls: string[]) => {
  urls.forEach((url) => {
    cy.document().invoke('defaultView.fetch', url)
  })
}

describe('remote driver: waiting in a cross-origin AUT', { experimentalRemoteDriver: true }, () => {
  beforeEach(() => {
    cy.visit('/fixtures/primary-origin.html')
    cy.get('a[data-cy="dom-link"]').click()
  })

  context('number', () => {
    it('waits for the specified value', () => {
      const delay = cy.spy(Cypress.Promise, 'delay')

      cy.wait(50).then(() => {
        expect(delay).to.be.calledWith(50, 'wait')
      })
    })
  })

  context('alias', () => {
    it('waits for the route alias to have a request', () => {
      cy.intercept('/foo', (req) => {
        // delay the response so only the request will be available
        req.reply({
          delay: 500,
        })
      }).as('foo')

      fetchInAut('/foo')

      cy.wait('@foo.request').then((xhr) => {
        expect(xhr.request.url).to.include('/foo')
        expect(xhr.response).to.be.undefined
      })
    })

    it('waits for the route alias to have a response', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', (req) => {
        // delay the response to ensure the wait will wait for response
        req.reply({
          delay: 200,
          body: response,
        })
      }).as('foo')

      fetchInAut('/foo')

      cy.wait('@foo.response').then((xhr) => {
        expect(xhr.request.url).to.include('/foo')
        expect(xhr.response?.body).to.deep.equal(response)
      })
    })

    it('waits for the route alias (aliased through \'as\')', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', response).as('foo')

      fetchInAut('/foo')
      cy.wait('@foo').its('response.body').should('deep.equal', response)
    })

    it('waits for the route alias (aliased through req object)', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', (req) => {
        req.reply(response)
        req.alias = 'foo'
      })

      fetchInAut('/foo')
      cy.wait('@foo').its('response.body').should('deep.equal', response)
    })

    it('waits for multiple aliases', () => {
      const fooResponse = { foo: 'foo' }
      const barResponse = { bar: 'bar' }

      cy.intercept('/foo', fooResponse).as('foo')
      cy.intercept('/bar', barResponse).as('bar')

      fetchInAut('/foo', '/bar')

      cy.wait(['@foo', '@bar']).then((interceptions) => {
        expect(interceptions[0].response?.body).to.deep.equal(fooResponse)
        expect(interceptions[1].response?.body).to.deep.equal(barResponse)
      })
    })

    it('waits for multiple aliases using separate waits', () => {
      const fooResponse = { foo: 'foo' }
      const barResponse = { bar: 'bar' }

      cy.intercept('/foo', fooResponse).as('foo')
      cy.intercept('/bar', barResponse).as('bar')

      fetchInAut('/foo', '/bar')

      cy.wait('@foo').then((interception) => {
        expect(interception.response?.body).to.deep.equal(fooResponse)
      })
      .wait('@bar').then((interception) => {
        expect(interception.response?.body).to.deep.equal(barResponse)
      })
    })

    context('errors', () => {
      it('throws when request is not made', { requestTimeout: 500 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('Timed out retrying after 500ms: `cy.wait()` timed out waiting `500ms` for the 1st request to the route: `not_called`. No request ever occurred.')
          expect(err.docsUrl).to.equal('https://on.cypress.io/wait')
          done()
        })

        cy.intercept('/not_called').as('not_called')

        cy.wait('@not_called')
      })

      it('throw when alias doesn\'t match any registered alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.wait()` could not find a registered alias for: `@not_found`.\nAvailable aliases are: `foo`.')
          done()
        })

        cy.intercept('/foo', {}).as('foo')

        cy.wait('@not_found')
      })

      it('throws when 2nd alias doesn\'t match any registered alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.wait()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.')

          done()
        })

        cy.intercept('/foo', {}).as('foo')

        fetchInAut('/foo')
        cy.wait(['@foo', '@bar'])
      })

      it('throws when alias is missing \'@\' but matches an available alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('Invalid alias: `foo`.\nYou forgot the `@`. It should be written as: `@foo`.')

          done()
        })

        cy.intercept('/foo', {}).as('foo')

        // @ts-expect-error intentionally omitting '@' to test runtime error message
        cy.wait('foo')
      })

      it('throws when 2nd alias isn\'t a route alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

          done()
        })

        cy.intercept('/foo', {}).as('foo')
        cy.get('body').as('bar')

        fetchInAut('/foo')
        cy.wait(['@foo', '@bar'])
      })

      it('throws when foo cannot resolve', { requestTimeout: 500 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.wait()` timed out waiting `500ms` for the 1st request to the route: `foo`. No request ever occurred.')

          done()
        })

        cy.intercept('/foo', {}).as('foo')
        cy.intercept('/bar', {}).as('bar')

        fetchInAut('/bar')
        cy.wait(['@foo', '@bar'])
      })

      it('throws when passed multiple string arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.wait()` was passed invalid arguments. You cannot pass multiple strings. If you\'re trying to wait for multiple routes, use an array.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

          done()
        })

        // @ts-expect-error - passes invalid arguments on purpose to assert the error
        cy.wait('@foo', '@bar')
      })
    })
  })
})
