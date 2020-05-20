import { sendXhr, abortXhr } from './util'

Cypress.Commands.add('failExpect', () => {
  expect('actual').to.equal('expected')
})

Cypress.Commands.add('failAssert', () => {
  assert(false, 'should be true')
})

Cypress.Commands.add('failAssertMethod', () => {
  assert.equal('actual', 'expected')
})

Cypress.Commands.add('failException', () => {
  ({}).bar()
})

Cypress.Commands.add('failCommand', () => {
  cy.get('#does-not-exist')
})

Cypress.Commands.add('failChainedCommand', () => {
  cy.get('body').find('#does-not-exist')
})

Cypress.Commands.add('failThenAssertion', () => {
  cy.wrap({}).then(() => {
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failShouldCallbackAssertion', () => {
  cy.wrap({}).should(() => {
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failThenException', () => {
  cy.wrap({}).then(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failThenCommandFailure', () => {
  cy.wrap({}).then(() => {
    cy.get('#does-not-exist')
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
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failAfterCallbackSuccessAssertion', () => {
  cy.wrap({})
  .should(() => {
    expect(true).to.be.true
  })
  .should('have.property', 'foo')
})

Cypress.Commands.add('failCommandAfterShouldSuccess', () => {
  cy.wrap({ foo: 'foo' }).should('have.property', 'foo')
  cy.get('#does-not-exist')
})

Cypress.Commands.add('failEachAssertion', () => {
  cy.wrap([1]).each(() => {
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failEachException', () => {
  cy.wrap([1]).each(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failEachCommandFailure', () => {
  cy.wrap([1]).each(() => {
    cy.get('#does-not-exist')
  })
})

Cypress.Commands.add('failSpreadAssertion', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failSpreadException', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failSpreadCommandFailure', () => {
  cy.wrap([1, 2, 3]).spread(() => {
    cy.get('#does-not-exist')
  })
})

Cypress.Commands.add('failWithinAssertion', () => {
  cy.get('body').within(() => {
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failWithinException', () => {
  cy.get('body').within(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failWithinCommandFailure', () => {
  cy.get('body').within(() => {
    cy.get('#does-not-exist')
  })
})

Cypress.Commands.add('failWrapAssertion', () => {
  cy.wrap(() => {
    expect('actual').to.equal('expected')
  }).then((fn) => fn())
})

Cypress.Commands.add('failWrapException', () => {
  cy.wrap(() => {
    ({}).bar()
  }).then((fn) => fn())
})

Cypress.Commands.add('failWrapCommandFailure', () => {
  cy.wrap(() => {
    cy.get('#does-not-exist')
  }).then((fn) => fn())
})

Cypress.Commands.add('failVisitBeforeLoadAssertion', () => {
  cy.visit('/index.html', {
    onBeforeLoad () {
      expect('actual').to.equal('expected')
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
      expect('actual').to.equal('expected')
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
    expect('actual').to.equal('expected')
  })
})

Cypress.Commands.add('failRouteCallbackException', () => {
  cy.server().route(() => {
    ({}).bar()
  })
})

Cypress.Commands.add('failRouteCallbackCommandFailure', () => {
  cy.server().route(() => {
    cy.get('#does-not-exist')

    return '/foo'
  })
})

Cypress.Commands.add('failRouteOnAbortAssertion', () => {
  cy.server().route({
    url: '/foo',
    onAbort () {
      expect('actual').to.equal('expected')
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
      expect('actual').to.equal('expected')
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
      expect('actual').to.equal('expected')
    },
  })
  .visit('/xhr.html').get('#fetch').click()
  .wait(10000)
})

Cypress.Commands.add('failRouteOnResponseException', () => {
  cy.server().route({
    url: '/users',
    onResponse () {
      ({}).bar()
    },
  })
  .visit('/xhr.html').get('#fetch').click()
  .wait(10000)
})

Cypress.Commands.add('failServerOnAbortAssertion', () => {
  cy.server({
    onAbort () {
      expect('actual').to.equal('expected')
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
      expect('actual').to.equal('expected')
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
      expect('actual').to.equal('expected')
    },
  })
  .route('/users')
  .visit('/xhr.html').get('#fetch').click()
  .wait(10000)
})

Cypress.Commands.add('failServerOnResponseException', () => {
  cy.server({
    onResponse () {
      ({}).bar()
    },
  })
  .route('/users')
  .visit('/xhr.html').get('#fetch').click()
  .wait(10000)
})

Cypress.Commands.add('failReadFileExistence', () => {
  cy.readFile('does-not-exist', { timeout: 0 })
})

Cypress.Commands.add('cypressValidationError', () => {
  cy.viewport()
})

Cypress.Commands.add('chaiExpectValidationError', () => {
  expect(true).to.be.nope
})

Cypress.Commands.add('chaiAssertValidationError', () => {
  assert.deepInclude()
})

Cypress.Commands.add('failEventHandlerAssertion', () => {
  cy.on('window:load', () => {
    expect('actual').to.equal('expected')
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
