import { runSpec } from './support/spec-loader'
import { runCypressInCypressMochaEventsTest } from './support/mochaEventsUtils'
import { snapshots } from './runner.mochaEvents.snapshots'

/**
 * These tests require specs to be loaded and executed within the inner Cypress context. These
 * specs must complete within the duration of a Cypress command timeout to succeed. The execution
 * time within the inner Cypress is resource/OS dependant and can exceed the default value (4s),
 * so we have increased the command timeout to allow the inner spec more time to complete.
 */
describe('src/cypress/runner', { retries: 0, defaultCommandTimeout: 7500 }, () => {
  describe('tests finish with correct state', () => {
    describe('hook failures', () => {
      it('fail in [before]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state hook failures fail in [before] #1',
          done,
        )

        runSpec({
          fileName: 'fail-with-before.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [beforeEach]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state hook failures fail in [beforeEach] #1',
          done,
        )

        runSpec({
          fileName: 'fail-with-beforeEach.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [after]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state hook failures fail in [after] #1',
          done,
        )

        runSpec({
          fileName: 'fail-with-after.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('fail in [afterEach]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state hook failures fail in [afterEach] #1',
          done,
        )

        runSpec({
          fileName: 'fail-with-afterEach.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })
    })

    describe('mocha grep', () => {
      it('fail with [only]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state mocha grep fail with [only] #1',
          done,
        )

        runSpec({
          fileName: 'fail-with-only.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })

      it('pass with [only]', (done) => {
        const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
          snapshots,
          'src/cypress/runner tests finish with correct state mocha grep pass with [only] #1',
          done,
        )

        runSpec({
          fileName: 'pass-with-only.mochaEvents.cy.js',
        }).then((win) => {
          assertMatchingSnapshot(win)
        })
      })
    })
  })

  describe('mocha events', () => {
    it('simple single test', (done) => {
      const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
        snapshots,
        'src/cypress/runner mocha events simple single test #1',
        done,
      )

      runSpec({
        fileName: 'simple-single-test.mochaEvents.cy.js',
      }).then((win) => {
        assertMatchingSnapshot(win)
      })
    })

    it('simple three tests', (done) => {
      const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
        snapshots,
        'src/cypress/runner mocha events simple three tests #1',
        done,
      )

      runSpec({
        fileName: 'three-tests-with-hooks.mochaEvents.cy.js',
      }).then((win) => {
        assertMatchingSnapshot(win)
      })
    })
  })
})
