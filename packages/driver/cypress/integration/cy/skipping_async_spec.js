const { Screenshot } = Cypress

let failedEventFired = false

Cypress.on('fail', (error) => {
  failedEventFired = true
  throw new Error(error)
})

let screenshotTaken = false

Screenshot.defaults({ onAfterScreenshot: () => {
  screenshotTaken = true
} })

const pendingTests = []
const passedTests = []

Cypress.on('test:after:run', (test) => {
  if (test.state === 'pending') {
    return pendingTests.push(test)
  }

  if (test.state === 'passed') {
    return passedTests.push(test)
  }
})

beforeEach(() => {
  // Set isInteractive to false to ensure that screenshots will be
  // triggered in both run and open mode
  Cypress.config('isInteractive', false)
})

describe('skipped test', () => {
  it('does not fail', function () {
    cy.then(() => {
      this.skip()
    }).then(() => {
      expect(true).to.be.false
    })
  })

  it('does not prevent subsequent tests from running', () => {
    expect(true).to.be.true
  })
})

describe('skipped test side effects', () => {
  it('does not have a screenshot taken', () => {
    expect(screenshotTaken).to.be.false
  })

  it('does not fire failed event', () => {
    expect(failedEventFired).to.be.false
  })

  it('does still mark all tests with the correct state', () => {
    expect(pendingTests).to.have.length(1)
    expect(passedTests).to.have.length(3)
  })
})
