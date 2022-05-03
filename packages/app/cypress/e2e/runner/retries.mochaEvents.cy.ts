import { runSpec } from './support/spec-loader'
import { runCypressInCypressMochaEventsTest } from './support/mochaEventsUtils'
import { snapshots } from './retries.mochaEvents.snapshots'

/**
 * These tests are slow, particular slow on windows, thus the
 * 7500m timeout.
 * TODO: Find out if they are objectively slower on windows than on linux,
 * and if it's a 10.x specific performance regression.
 */
describe('src/cypress/runner retries mochaEvents', { retries: 0 }, () => {
  // NOTE: for test-retries

  it('simple retry', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents simple retry #1',
      done,
    )

    runSpec({
      fileName: 'simple-fail.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with hooks', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents test retry with hooks #1',
      done,
    )

    runSpec({
      fileName: 'test-retry-with-hooks.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with hooks', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents test retry with hooks #1',
      done,
    )

    runSpec({
      fileName: 'test-retry-with-hooks.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('test retry with [only]', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents test retry with [only] #1',
      done,
    )

    runSpec({
      fileName: 'test-retry-with-only.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('can retry from [beforeEach]', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents can retry from [beforeEach] #1',
      done,
    )

    runSpec({
      fileName: 'can-retry-from-beforeEach.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('can retry from [afterEach]', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents can retry from [afterEach] #1',
      done,
    )

    runSpec({
      fileName: 'can-retry-from-afterEach.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('cant retry from [before]', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents cant retry from [before] #1',
      done,
    )

    runSpec({
      fileName: 'cant-retry-from-before.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  it('three tests with retry', (done) => {
    const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
      snapshots,
      'src/cypress/runner retries mochaEvents three tests with retry #1',
      done,
    )

    runSpec({
      fileName: 'three-tests-with-retry.retries.mochaEvents.cy.js',
    }).then((win) => {
      assertMatchingSnapshot(win)
    })
  })

  describe('cleanses errors before emitting', () => {
    it('does not try to serialize error with err.actual as DOM node', (done) => {
      const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
        snapshots,
        'src/cypress/runner retries mochaEvents cleanses errors before emitting does not try to serialize error with err.actual as DOM node #1',
        done,
      )

      runSpec({
        fileName: 'does-not-serialize-dom-error.cy.js',
      }).then((win) => {
      // should not have err.actual, expected properties since the subject is a DOM element
        assertMatchingSnapshot(win)
      })
    })
  })
})
