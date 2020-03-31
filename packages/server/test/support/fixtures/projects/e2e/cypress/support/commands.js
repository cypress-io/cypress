import { sendXhr, abortXhr } from './util'

Cypress.Commands.add('failAssertion', () => {
  expect(true).to.be.false
})

Cypress.Commands.add('failException', () => {
  ({}).bar()
})

Cypress.Commands.add('failCommand', () => {
  cy.get('h1')
})

Cypress.Commands.add('failChainedCommand', () => {
  cy.get('div').find('h1', { timeout: 1 })
})

Cypress.Commands.add('failThenAssertion', () => {
  cy.wrap({}).then(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failShouldCallbackAssertion', () => {
  cy.wrap({}).should(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failThenException', () => {
  cy.wrap({}).then(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failThenCommandFailure', () => {
  cy.wrap({}).then(() => {
    cy.get('h1')
  })
})

Cypress.Commands.add('failShouldCallbackException', () => {
  cy.wrap({}).should(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failShouldAssertion', () => {
  cy.wrap({})
  .should('have.property', 'foo')
})

Cypress.Commands.add('failAfterMultipleShoulds', () => {
  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  .should('equal', 'bar')
})

Cypress.Commands.add('failAfterMultipleShouldCallbacksException', () => {
  cy.wrap({})
  .should(() => {
    expect(true).to.be.true
  })
  .should(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failAfterMultipleShouldCallbacksAssertion', () => {
  cy.wrap({})
  .should(() => {
    expect(true).to.be.true
  })
  .should(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failCommandAfterShouldSuccess', () => {
  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  cy.get('h1')
})

Cypress.Commands.add('failEachAssertion', () => {
  cy.wrap([1]).each(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failEachException', () => {
  cy.wrap([1]).each(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failEachCommandFailure', () => {
  cy.wrap([1]).each(() => {
    cy.get('h1')
  })
})

Cypress.Commands.add('failSpreadAssertion', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failSpreadException', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failSpreadCommandFailure', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    cy.get('h1')
  })
})

Cypress.Commands.add('failWithinAssertion', () => {
  cy.get('body').within(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failWithinException', () => {
  cy.get('body').within(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failWithinCommandFailure', () => {
  cy.get('body').within(() => {
    cy.get('h1')
  })
})

Cypress.Commands.add('failWrapAssertion', () => {
  cy.wrap(() => {
    expect(true).to.be.false
  }).then((fn) => fn())
})

Cypress.Commands.add('failWrapException', () => {
  cy.wrap(() => {
    ({}).bar()
  }).then((fn) => fn())
})

Cypress.Commands.add('failWrapCommandFailure', () => {
  cy.wrap(() => {
    cy.get('h1')
  }).then((fn) => fn())
})

Cypress.Commands.add('failVisitBeforeLoadAssertion', () => {
  cy.visit('/index.html', {
    onBeforeLoad () {
      expect(true).to.be.false
    },
  })
})

Cypress.Commands.add('failVisitBeforeLoadException', () => {
  cy.visit('/index.html', {
    onBeforeLoad () {
      ({}).bar()
    },
  })
})

Cypress.Commands.add('failVisitLoadAssertion', () => {
  cy.visit('/index.html', {
    onLoad () {
      expect(true).to.be.false
    },
  })
})

Cypress.Commands.add('failVisitLoadException', () => {
  cy.visit('/index.html', {
    onLoad () {
      ({}).bar()
    },
  })
})

Cypress.Commands.add('failRouteCallbackAssertion', () => {
  cy.server().route(() => {
    expect(true).to.be.false
  })
})

Cypress.Commands.add('failRouteCallbackException', () => {
  cy.server().route(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failRouteCallbackCommandFailure', () => {
  cy.server().route(() => {
    cy.get('h1')

    return '/foo'
  })
})

Cypress.Commands.add('failRouteOnAbortAssertion', () => {
  cy.server().route({
    url: '/foo',
    onAbort () {
      expect(true).to.be.false
    },
  })
  .window().then(abortXhr)
})

Cypress.Commands.add('failRouteOnAbortException', () => {
  cy.server().route({
    url: '/foo',
    onAbort () {
      ({}).bar()
    },
  })
  .window().then(abortXhr)
})

Cypress.Commands.add('failRouteOnRequestAssertion', () => {
  cy.server().route({
    url: '/foo',
    onRequest () {
      expect(true).to.be.false
    },
  })
  .window().then(sendXhr)
})

Cypress.Commands.add('failRouteOnRequestException', () => {
  cy.server().route({
    url: '/foo',
    onRequest () {
      ({}).bar()
    },
  })
  .window().then(sendXhr)
})

Cypress.Commands.add('failRouteOnResponseAssertion', () => {
  cy.server().route({
    url: '/users',
    onResponse () {
      expect(true).to.be.false
    },
  })
  .visit('/xhr.html').get('#fetch').click()
})

Cypress.Commands.add('failRouteOnResponseException', () => {
  cy.server().route({
    url: '/users',
    onResponse () {
      ({}).bar()
    },
  })
  .visit('/xhr.html').get('#fetch').click()
})

Cypress.Commands.add('failServerOnAbortAssertion', () => {
  cy.server({
    onAbort () {
      expect(true).to.be.false
    },
  })
  .route('/foo')
  .window().then(abortXhr)
})

Cypress.Commands.add('failServerOnAbortException', () => {
  cy.server({
    onAbort () {
      ({}).bar()
    },
  })
  .route('/foo')
  .window().then(abortXhr)
})

Cypress.Commands.add('failServerOnRequestAssertion', () => {
  cy.server({
    onRequest () {
      expect(true).to.be.false
    },
  })
  .route('/foo')
  .window().then(sendXhr)
})

Cypress.Commands.add('failServerOnRequestException', () => {
  cy.server({
    onRequest () {
      ({}).bar()
    },
  })
  .route('/foo')
  .window().then(sendXhr)
})

Cypress.Commands.add('failServerOnResponseAssertion', () => {
  cy.server({
    onResponse () {
      expect(true).to.be.false
    },
  })
  .route('/users')
  .visit('/xhr.html').get('#fetch').click()
})

Cypress.Commands.add('failServerOnResponseException', () => {
  cy.server({
    onResponse () {
      ({}).bar()
    },
  })
  .route('/users')
  .visit('/xhr.html').get('#fetch').click()
})

Cypress.Commands.add('failEventHandlerAssertion', () => {
  cy.on('window:load', () => {
    expect(true).to.be.false
  })

  cy.visit('http://localhost:1919')
})

Cypress.Commands.add('failEventHandlerException', () => {
  cy.on('window:load', () => {
    ({}).bar()
  })

  cy.visit('http://localhost:1919')
})

Cypress.Commands.add('failSyncAppException', () => {
  cy.visit('/js_errors.html')
  cy.get('.sync-error').click()
})

Cypress.Commands.add('failAsyncAppException', () => {
  cy.visit('/js_errors.html')
  cy.get('.async-error').click()
  cy.wait(10000)
})

Cypress.Commands.add('failAsyncException', () => {
  setTimeout(() => {
    ({}).bar()
  })

  cy.wait(10000)
})

Cypress.Commands.add('failInternalCypressMethod', () => {
  top.window.eval(`Cypress.dom.isJquery = () => { throw new Error('thrown in CypressdomisJquery') }`)

  cy.get('body')
})

Cypress.Commands.add('failInternalCyMethod', () => {
  top.window.eval(`cy.expect = () => { throw new Error('thrown in cyexpect') }`)

  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
})
