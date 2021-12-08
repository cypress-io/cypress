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

describe('generally skipped test', () => {
  before(function () {
    this.skip()
  })

  it('should not fail', function () {
    expect(true).to.be.false
  })
})

describe('individually skipped test', () => {
  it('should not fail', function () {
    this.skip()
    expect(true).to.be.false
  })
})

describe('skipped test side effects', () => {
  it('should not have a screenshot taken', () => {
    expect(screenshotTaken).to.be.false
  })

  it('should not fire failed event', () => {
    expect(failedEventFired).to.be.false
  })

  it('should still mark all tests with the correct state', () => {
    expect(pendingTests).to.have.length(2)
    expect(passedTests).to.have.length(2)
  })
})
