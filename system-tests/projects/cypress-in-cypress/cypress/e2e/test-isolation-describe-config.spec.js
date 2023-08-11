const shouldAlwaysResetPage = (config) => {
  const isRunMode = !config('isInteractive')
  const isHeadedNoExit = config('browser').isHeaded && !config('exit')

  return isRunMode && !isHeadedNoExit
}

const TEST_METADATA = {
  'passes 1': {
    start: 'about:blank',
    firesTestBeforeAfterRunAsync: true,
    end: 'about:blank',
  },
  'passes 2': {
    start: 'about:blank',
    firesTestBeforeAfterRunAsync: true,
    end: '/cypress/e2e/dom-content.html',
  },
  'passes 3': {
    start: '/cypress/e2e/dom-content.html',
    firesTestBeforeAfterRunAsync: true,
    end: '/cypress/e2e/dom-content.html',
  },
  'passes 4': {
    start: '/cypress/e2e/dom-content.html',
    firesTestBeforeAfterRunAsync: true,
    end: 'about:blank',
  },
  'passes 5': {
    start: 'about:blank',
    firesTestBeforeAfterRunAsync: true,
    end: 'about:blank',
  },
  'passes 6': {
    start: 'about:blank',
    firesTestBeforeAfterRunAsync: true,
    end: shouldAlwaysResetPage(Cypress.config) ? 'about:blank' : '/cypress/e2e/dom-content.html',
  },
}

let cypressEventsHandled = 0

const testBeforeRun = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href.endsWith(TEST_METADATA[args[1].title].start)).to.equal(true)
  cypressEventsHandled += 1
}

const testBeforeRunAsync = (Cypress, ...args) => {
  expect(Cypress.state('window').location.href.endsWith(TEST_METADATA[args[1].title].start)).to.equal(true)
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
    expect(cypressEventsHandled).to.equal(15)
  } else if (test.title === 'passes 4') {
    expect(cypressEventsHandled).to.equal(20)
  } else if (test.title === 'passes 5') {
    expect(cypressEventsHandled).to.equal(25)
  } else if (test.title === 'passes 6') {
    expect(cypressEventsHandled).to.equal(!shouldAlwaysResetPage(Cypress.config) ? 29 : 30)
  }
})

describe('test isolation', () => {
  beforeEach(() => {
    cy.visit('cypress/e2e/dom-content.html')
  })

  describe('suite 1', { testIsolation: true }, () => {
    it('passes 1', () => {
      expect(true).to.equal(true)
    })

    it('passes 2', () => {
      expect(true).to.equal(true)
    })
  })

  describe('suite 2', { testIsolation: false }, () => {
    it('passes 3', () => {
      expect(true).to.equal(true)
    })

    it('passes 4', () => {
      expect(true).to.equal(true)
    })
  })

  describe('suite 3', { testIsolation: true }, () => {
    it('passes 5', () => {
      expect(true).to.equal(true)
    })

    it('passes 6', () => {
      expect(true).to.equal(true)
    })
  })
})
