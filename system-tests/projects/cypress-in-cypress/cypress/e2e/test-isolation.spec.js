const shouldAlwaysResetPage = (config) => {
  const isRunMode = !config('isInteractive')
  const isHeadedNoExit = config('browser').isHeaded && !config('exit')

  return isRunMode && !isHeadedNoExit
}

const TEST_METADATA = {
  'passes 1': {
    start: 'about:srcdoc',
    firesTestBeforeAfterRunAsync: true,
    end: 'about:srcdoc',
  },
  'passes 2': {
    start: 'about:srcdoc',
    firesTestBeforeAfterRunAsync: true,
    end: 'about:srcdoc',
  },
  'passes 3': {
    start: 'about:srcdoc',
    firesTestBeforeAfterRunAsync: !Cypress.config('isInteractive'),
    end: shouldAlwaysResetPage(Cypress.config) ? 'about:srcdoc' : '/cypress/e2e/dom-content.html',
  },
}

let cypressEventsHandled = 0

const testBeforeRun = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href).to.eq(TEST_METADATA[args[1].title].start)
  cypressEventsHandled += 1
}

const testBeforeRunAsync = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href).to.eq(TEST_METADATA[args[1].title].start)
  cypressEventsHandled += 1
}

const testBeforeAfterRunAsync = (Cypress, ...args) => {
  expect(TEST_METADATA[args[1].title].firesTestBeforeAfterRunAsync).to.be.true
  cypressEventsHandled += 1
}

const testAfterRun = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href.endsWith(TEST_METADATA[args[1].title].end)).to.equal(true)
  cypressEventsHandled += 1
}

const testAfterRunAsync = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href.endsWith(TEST_METADATA[args[1].title].end)).to.equal(true)
  cypressEventsHandled += 1
}

const cypressEvents = [
  ['test:before:run', testBeforeRun],
  ['test:before:run:async', testBeforeRunAsync],
  ['test:before:after:run:async', testBeforeAfterRunAsync],
  ['test:after:run', testAfterRun],
  ['test:after:run:async', testAfterRunAsync],
]

cypressEvents.forEach(([event, handler]) => {
  Cypress.prependListener(event, (...args) => {
    handler(Cypress, ...args)
  })
})

Cypress.on('test:after:run:async', async (test) => {
  if (test.title === 'passes 1') {
    expect(cypressEventsHandled).to.equal(5)
  } else if (test.title === 'passes 2') {
    expect(cypressEventsHandled).to.equal(10)
  } else if (test.title === 'passes 3') {
    expect(cypressEventsHandled).to.equal(!shouldAlwaysResetPage(Cypress.config) ? 14 : 15)
  }
})

describe('test isolation', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/dom-content.html')
  })

  it('passes 1', () => {
    expect(true).to.equal(true)
  })

  it('passes 2', () => {
    expect(true).to.equal(true)
  })

  it('passes 3', () => {
    expect(true).to.equal(true)
  })
})
