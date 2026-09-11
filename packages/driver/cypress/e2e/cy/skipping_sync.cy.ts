export {} // make typescript see this as a module

const { Screenshot } = Cypress

let failedEventFired = false

Cypress.on('fail', (error) => {
  failedEventFired = true
  throw new Error(`${error}`)
})

let screenshotTaken = false

Screenshot.defaults({ onAfterScreenshot: () => {
  screenshotTaken = true
} })

const pendingTests: Cypress.ObjectLike[] = []
const passedTests: Cypress.ObjectLike[] = []

Cypress.on('test:after:run', (test) => {
  if (test.state === 'pending') {
    pendingTests.push(test)
  } else if (test.state === 'passed') {
    passedTests.push(test)
  }
})

beforeEach(() => {
  // Set isInteractive to false to ensure that screenshots will be
  // triggered in both run and open mode. It is not a test override, so the
  // types reject it even though the driver applies it at runtime.
  // @ts-expect-error
  Cypress.config('isInteractive', false)
})

describe('generally skipped test', () => {
  before(function () {
    this.skip()
  })

  it('does not fail', function () {
    expect(true).to.be.false
  })
})

describe('individually skipped tests', () => {
  it('does not fail when using this.skip', function () {
    this.skip()
    expect(true).to.be.false
  })

  // NOTE: We are skipping this test in order to test skip functionality
  it.skip('does not fail when using it.skip', () => {
    expect(true).to.be.false
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
    expect(pendingTests).to.have.length(3)
    expect(passedTests).to.have.length(2)
  })
})
