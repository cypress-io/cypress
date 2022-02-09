describe('cy.intercept', () => {
  const emitProxyLog = () => {
    return Cypress.emit('request:event', 'incoming:request', {
      requestId: 1,
      method: 'GET',
      url: '',
      headers: {},
      resourceType: 'other',
      originalResourceType: 'other',
    })
  }

  it('assertion failure in request callback', () => {
    cy.intercept('/json-content-type', () => {
      expect('a').to.eq('b')
    })
    .then(() => {
      emitProxyLog()
      Cypress.emit('net:stubbing:event', 'before:request', {
        browserRequestId: 1,
        eventId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {
          url: '',
        },
      })
    })
    .wait(1000) // ensure the failure happens before test ends
  })

  it('assertion failure in response callback', () => {
    cy.intercept('/json-content-type', (req) => {
      req.reply(() => {
        expect('b').to.eq('c')
      })
    })
    .then(() => {
      emitProxyLog()
      Cypress.emit('net:stubbing:event', 'before:request', {
        browserRequestId: 1,
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {
          url: '',
        },
      })

      Cypress.emit('net:stubbing:event', 'before:response', {
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          id: Object.values(Cypress.state('routes'))[0].requests['1'].subscriptions[0].subscription.id,
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {
          url: '',
        },
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
      emitProxyLog()
      Cypress.emit('net:stubbing:event', 'before:request', {
        browserRequestId: 1,
        eventId: '1',
        requestId: '1',
        subscription: {
          // @ts-ignore
          routeId: Object.keys(Cypress.state('routes'))[0],
          await: true,
        },
        data: {
          url: '',
        },
      })

      Cypress.emit('net:stubbing:event', 'network:error', {
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
