import { findCrossOriginLogs } from '../../../../support/utils'

declare global {
  interface Window {
    xhrGet: any
  }
}

const xhrGet = (url) => {
  const xhr = new window.XMLHttpRequest()

  xhr.open('GET', url)
  xhr.send()
}

context('cy.origin waiting', { browser: '!webkit' }, () => {
  before(() => {
    cy.origin('http://www.foobar.com:3500', () => {
      window.xhrGet = (url) => {
        const xhr = new window.XMLHttpRequest()

        xhr.open('GET', url)
        xhr.send()
      }
    })
  })

  let logs: Map<string, any>

  beforeEach(() => {
    logs = new Map()

    cy.on('log:changed', (attrs, log) => {
      logs.set(attrs.id, log)
    })

    cy.visit('/fixtures/primary-origin.html')
  })

  context('number', () => {
    it('waits for the specified value', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        const delay = cy.spy(Cypress.Promise, 'delay')

        cy.wait(50).then(() => {
          expect(delay).to.be.calledWith(50, 'wait')
        })
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

      cy.once('command:retry', () => xhrGet('/foo'))

      cy.origin('http://www.foobar.com:3500', () => {
        cy.wait('@foo.request').then((xhr) => {
          expect(xhr.request.url).to.include('/foo')
          expect(xhr.response).to.be.undefined
        })
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

      cy.once('command:retry', () => xhrGet('/foo'))

      cy.origin('http://www.foobar.com:3500', { args: { response } }, ({ response }) => {
        cy.wait('@foo.response').then((xhr) => {
          expect(xhr.request.url).to.include('/foo')
          expect(xhr.response?.body).to.deep.equal(response)
        })
      })
    })

    it('waits for the route alias (aliased through \'as\')', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', response).as('foo')

      cy.origin('http://www.foobar.com:3500', { args: { response } }, ({ response }) => {
        cy.then(() => window.xhrGet('/foo'))
        cy.wait('@foo').its('response.body').should('deep.equal', response)
      })
    })

    it('waits for the route alias (aliased through req object)', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', (req) => {
        req.reply(response)
        req.alias = 'foo'
      })

      cy.origin('http://www.foobar.com:3500', { args: { response } }, ({ response }) => {
        cy.then(() => window.xhrGet('/foo'))

        cy.wait('@foo').its('response.body').should('deep.equal', response)
      })
    })

    it('has the correct log properties', () => {
      const response = { foo: 'foo' }

      cy.intercept('/foo', response).as('foo')

      cy.origin('http://www.foobar.com:3500', { args: { response } }, ({ response }) => {
        cy.then(() => window.xhrGet('/foo'))
        cy.wait('@foo').its('response.body').should('deep.equal', response)
      })

      cy.shouldWithTimeout(() => {
        const actualLog = Cypress._.pick(findCrossOriginLogs('wait', logs, 'localhost'),
          ['name', 'referencesAlias', 'aliasType', 'type', 'instrument', 'message'])

        const expectedLog = {
          name: 'wait',
          referencesAlias: [{ name: 'foo', cardinal: 1, ordinal: '1st' }],
          aliasType: 'route',
          type: 'parent',
          instrument: 'command',
          message: '',
        }

        expect(actualLog).to.deep.equal(expectedLog)
      })
    })

    it('can turn off logging when protocol is disabled', { protocolEnabled: false }, function () {
      cy.on('_log:added', (attrs, log) => {
        logs.set(attrs.id, log)
      })

      cy.intercept('/foo', {}).as('foo')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.then(() => window.xhrGet('/foo'))

        cy.wait('@foo', { log: false })
      })

      cy.shouldWithTimeout(() => {
        const waitLog = findCrossOriginLogs('wait', logs, 'localhost')

        expect(waitLog[0]).to.be.undefined
      })
    })

    it('can send hidden log when protocol is enabled', { protocolEnabled: true }, function () {
      cy.on('_log:added', (attrs, log) => {
        logs.set(attrs.id, log)
      })

      cy.intercept('/foo', {}).as('foo')

      cy.origin('http://www.foobar.com:3500', () => {
        cy.then(() => window.xhrGet('/foo'))

        cy.wait('@foo', { log: false })
      })

      cy.shouldWithTimeout(() => {
        const waitLog = findCrossOriginLogs('wait', logs, 'localhost')

        expect(waitLog.name).to.eq('wait')
        expect(waitLog.hidden).to.be.true
        expect(waitLog.snapshots.length, 'log snapshot length').to.eq(1)
      })
    })

    it('waits for multiple aliases', () => {
      const fooResponse = { foo: 'foo' }
      const barResponse = { bar: 'bar' }

      cy.intercept('/foo', fooResponse).as('foo')
      cy.intercept('/bar', barResponse).as('bar')

      cy.origin('http://www.foobar.com:3500', { args: { fooResponse, barResponse } }, ({ fooResponse, barResponse }) => {
        cy.then(() => {
          window.xhrGet('/foo')
          window.xhrGet('/bar')
        })

        cy.wait(['@foo', '@bar']).then((interceptions) => {
          expect(interceptions[0].response?.body).to.deep.equal(fooResponse)
          expect(interceptions[1].response?.body).to.deep.equal(barResponse)
        })
      })
    })

    it('waits for multiple aliases using separate waits', () => {
      const fooResponse = { foo: 'foo' }
      const barResponse = { bar: 'bar' }

      cy.intercept('/foo', fooResponse).as('foo')
      cy.intercept('/bar', barResponse).as('bar')

      cy.origin('http://www.foobar.com:3500', { args: { fooResponse, barResponse } }, ({ fooResponse, barResponse }) => {
        cy.then(() => {
          window.xhrGet('/foo')
          window.xhrGet('/bar')
        })

        cy.wait('@foo').then((interception) => {
          expect(interception.response?.body).to.deep.equal(fooResponse)
        })
        .wait('@bar').then((interception) => {
          expect(interception.response?.body).to.deep.equal(barResponse)
        })
      })
    })

    context('errors', () => {
      it('throws when request is not made', { requestTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('Timed out retrying after 100ms: `cy.wait()` timed out waiting `100ms` for the 1st request to the route: `not_called`. No request ever occurred.')
          expect(err.docsUrl).to.equal('https://on.cypress.io/wait')
          done()
        })

        cy.intercept('/not_called').as('not_called')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.wait('@not_called')
        })
      })

      it('throw when alias doesn\'t match any registered alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.equal('`cy.wait()` could not find a registered alias for: `@not_found`.\nAvailable aliases are: `foo`.')
          done()
        })

        cy.intercept('/foo', {}).as('foo')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.wait('@not_found')
        })
      })

      it('throws when 2nd alias doesn\'t match any registered alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.wait()` could not find a registered alias for: `@bar`.\nAvailable aliases are: `foo`.')

          done()
        })

        cy.intercept('/foo', {}).as('foo')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.then(() => window.xhrGet('/foo'))
          .wait(['@foo', '@bar'])
        })
      })

      it('throws when alias is missing \'@\' but matches an available alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('Invalid alias: `foo`.\nYou forgot the `@`. It should be written as: `@foo`.')

          done()
        })

        cy.intercept('/foo', {}).as('foo')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.wait('foo')
        })
      })

      it('throws when 2nd alias isn\'t a route alias', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.wait()` only accepts aliases for routes.\nThe alias: `bar` did not match a route.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

          done()
        })

        cy.intercept('/foo', {}).as('foo')
        cy.get('body').as('bar')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.then(() => window.xhrGet('/foo'))
          .wait(['@foo', '@bar'])
        })
      })

      it('throws when foo cannot resolve', { requestTimeout: 100 }, (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.include('`cy.wait()` timed out waiting `100ms` for the 1st request to the route: `foo`. No request ever occurred.')

          done()
        })

        cy.once('command:retry', () => xhrGet('/bar'))

        cy.intercept('/foo', {}).as('foo')
        cy.intercept('/bar', {}).as('bar')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.wait(['@foo', '@bar'])
        })
      })

      it('throws when passed multiple string arguments', (done) => {
        cy.on('fail', (err) => {
          expect(err.message).to.eq('`cy.wait()` was passed invalid arguments. You cannot pass multiple strings. If you\'re trying to wait for multiple routes, use an array.')
          expect(err.docsUrl).to.eq('https://on.cypress.io/wait')

          done()
        })

        cy.origin('http://www.foobar.com:3500', () => {
          // @ts-ignore
          cy.wait('@foo', '@bar')
        })
      })
    })
  })

  context('#consoleProps', () => {
    it('number', () => {
      cy.origin('http://www.foobar.com:3500', () => {
        cy.wait(200)
      })

      cy.shouldWithTimeout(() => {
        const { consoleProps } = findCrossOriginLogs('wait', logs, 'foobar.com')

        expect(consoleProps.name).to.equal('wait')
        expect(consoleProps.type).to.equal('command')
        expect(consoleProps.props['Waited For']).to.equal('200ms before continuing')
      })
    })

    context('alias', () => {
      it('waiting on one alias', () => {
        cy.intercept('/foo', {}).as('foo')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.then(() => window.xhrGet('/foo'))
          cy.wait('@foo')
        })

        cy.shouldWithTimeout(() => {
          const log = findCrossOriginLogs('wait', logs, 'localhost')
          const consoleProps = log.consoleProps()

          expect(consoleProps.name).to.equal('wait')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props['Waited For']).to.equal('foo')
          expect(consoleProps.props.Yielded).to.equal(Cypress.state('routes')[consoleProps.props.Yielded.routeId].requests[consoleProps.props.Yielded.id])
        })
      })

      it('waiting on multiple aliases', () => {
        cy.intercept('/foo', {}).as('foo')
        cy.intercept('/bar', {}).as('bar')

        cy.origin('http://www.foobar.com:3500', () => {
          cy.then(() => {
            window.xhrGet('/foo')
            window.xhrGet('/bar')
          })

          cy.wait(['@foo', '@bar'])
        })

        cy.shouldWithTimeout(() => {
          const log = findCrossOriginLogs('wait', logs, 'localhost')
          const consoleProps = log.consoleProps()

          expect(consoleProps.name).to.equal('wait')
          expect(consoleProps.type).to.equal('command')
          expect(consoleProps.props['Waited For']).to.equal('foo, bar')
          const routes = Cypress.state('routes')
          const yielded = consoleProps.props.Yielded
          const expectedRoutes = [routes[yielded[0].routeId].requests[yielded[0].id], routes[yielded[1].routeId].requests[yielded[1].id]]

          expect(yielded).to.deep.equal(expectedRoutes)
        })
      })
    })
  })
})
