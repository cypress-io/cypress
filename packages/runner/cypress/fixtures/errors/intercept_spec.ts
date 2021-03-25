import './setup'

describe('cy.intercept', () => {
  const { $ } = Cypress

  it('assertion failure in req callback', () => {
    cy.intercept('/json-content-type', () => {
      expect('a').to.eq('b')
    })
    .then(() => {
      Cypress.emit('net:event', 'before:request', {
        eventId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {},
      })
    })
    .wait(1000) // ensure the failure happens before test ends
  })

  it('assertion failure in res callback', () => {
    cy.intercept('/json-content-type', (req) => {
      req.reply(() => {
        expect('b').to.eq('c')
      })
    })
    .then(() => {
      Cypress.emit('net:event', 'before:request', {
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {},
      })

      Cypress.emit('net:event', 'before:response', {
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          id: Object.values(Cypress.state('routes'))[0].requests['1'].subscriptions[0].subscription.id,
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {},
      })
    })
    .wait(1000) // ensure the failure happens before test ends
  })

  it('fails when erroneous response is received while awaiting response', () => {
    cy.intercept('/fake', (req) => {
      req.reply(() => {
        throw new Error('this should not be reached')
      })
    })
    .then(() => {
      Cypress.emit('net:event', 'before:request', {
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {},
      })

      Cypress.emit('net:event', 'network:error', {
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
        },
        data: {
          error: {
            name: 'ResponseError',
            message: 'it errored',
          },
        },
      })
    })
    .wait(1000) // ensure the failure happens before test ends
  })
})
