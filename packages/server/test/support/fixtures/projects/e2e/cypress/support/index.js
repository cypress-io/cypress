Cypress.Commands.add('failAssertion', () => {
  expect(true).to.be.false
})

Cypress.Commands.add('failException', () => {
  ({}).bar()
})

Cypress.Commands.add('failCommand', () => {
  cy.get('h1', { timeout: 1 })
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
  cy.get('h1', { timeout: 1 })
})

before(function () {
  if (Cypress.browser.family === 'chrome') {
    return Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setDeviceMetricsOverride',
      params: {
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
        mobile: false,
        screenWidth: 1280,
        screenHeight: 720,
      },
    })
    .then(() => {
      // can't tell expect() not to log, so manually throwing here
      if (window.devicePixelRatio !== 1) {
        throw new Error('Setting devicePixelRatio to 1 failed')
      }
    })
  }
})
