import { loadSpec, runSpec } from './support/spec-loader'
import { runCypressInCypressMochaEventsTest } from './support/mochaEventsUtils'
import { snapshots } from './retries.experimentalRetries.mochaEvents.snapshots'

/**
 * The mochaEvent tests require a spec to be loaded and executed within an inner Cypress context.
 * The spec must load and execute within the duration of the Cypress command timeout.
 * The execution time of the inner Cypress is resource/OS dependant and can exceed the default value (4s),
 * so we have increased the command timeout to allow the inner spec more time to complete and report
 * its mocha event log.
 */

/**
 * In context to experimentalRetries, what is considered a passed/failed test is going to vary depending on the project.
 * 'detect-flake-and-pass-on-threshold' will have a passed test as long as the config passesRequired is satisfied on retries.
 * 'detect-flake-but-always-fail' projects should have the same passed/failed tests, but different number of attempts depending on stopIfAnyPassed
 */
describe('Experimental retries: mochaEvents & test status tests', { retries: 0, defaultCommandTimeout: 7500 }, () => {
  const projects: ['detect-flake-and-pass-on-threshold', 'detect-flake-but-always-fail', 'detect-flake-but-always-fail-stop-any-passed'] = ['detect-flake-and-pass-on-threshold', 'detect-flake-but-always-fail', 'detect-flake-but-always-fail-stop-any-passed']

  projects.forEach((project) => {
    describe(project, () => {
      // This will differ per strategy
      // for each project:
      // 'detect-flake-and-pass-on-threshold': will run a total of 6 times. The first attempt will fail and the next 5 attempts will pass. The test passes.
      // 'detect-flake-but-always-fail': will run a total of 10 times. The first attempt will fail and the next 9 attempts will pass. The test fails.
      // 'detect-flake-but-always-fail-stop-any-passed': will run a total of 2 times. The first attempt will fail and the second attempt will pass. The test fails.
      describe('simple retry', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents simple retry #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/simple-fail.retries.mochaEvents.cy.js',
            projectName: project,

          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/simple-fail.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 1 : 0,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 1,
          })
        })
      })

      // This will differ per strategy
      // for each project:
      // 'detect-flake-and-pass-on-threshold': will run a total of 6 times. The first attempt will fail and the next 5 attempts will pass. The test passes.
      // 'detect-flake-but-always-fail': will run a total of 10 times. The first attempt will fail and the next 9 attempts will pass. The test fails.
      // 'detect-flake-but-always-fail-stop-any-passed': will run a total of 2 times. The first attempt will fail and the second attempt will pass. The test fails.
      describe('test retry with hooks', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents test retry with hooks #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/test-retry-with-hooks.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/test-retry-with-hooks.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 1 : 0,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 1,
          })
        })
      })

      // This will differ per strategy
      // for each project:
      // 'detect-flake-and-pass-on-threshold': will run a total of 6 times. The first attempt will fail and the next 5 attempts will pass. The test passes.
      // 'detect-flake-but-always-fail': will run a total of 10 times. The first attempt will fail and the next 9 attempts will pass. The test fails.
      // 'detect-flake-but-always-fail-stop-any-passed': will run a total of 2 times. The first attempt will fail and the second attempt will pass. The test fails.
      describe('test retry with [only]', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents test retry with [only] #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/test-retry-with-only.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/test-retry-with-only.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 1 : 0,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 1,
          })
        })
      })

      // This will differ per strategy
      // for each project:
      // 'detect-flake-and-pass-on-threshold': will run a total of 6 times. The first attempt will fail and the next 5 attempts will pass. The test passes.
      // 'detect-flake-but-always-fail': will run a total of 10 times. The first attempt will fail and the next 9 attempts will pass. The test fails.
      // 'detect-flake-but-always-fail-stop-any-passed': will run a total of 2 times. The first attempt will fail and the second attempt will pass. The test fails.
      describe('can retry from [beforeEach]', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents can retry from [beforeEach] #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/can-retry-from-beforeEach.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/can-retry-from-beforeEach.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 1 : 0,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 1,
          })
        })
      })

      /**
       * This will differ per strategy. The spec under test is a bit more complex
       * for each project:
       *
       * 'detect-flake-and-pass-on-threshold':
       *
       * Suite 1 (passed)
       *  Test 1 (passed)
       *    Attempt 1 (failed)
       *    Attempt 2 (passed)
       *    Attempt 3 (passed)
       *    Attempt 4 (passed)
       *    Attempt 5 (passed)
       *    Attempt 6 (passed) (passesRequired met)
       *  Test 2 (passed)
       *    Attempt 1 (passed)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * Suite 2 (passed)
       *  Test 1 (passed)
       *    Attempt 1 (failed)
       *    Attempt 2 (failed)
       *    Attempt 3 (passed)
       *    Attempt 4 (passed)
       *    Attempt 5 (passed)
       *    Attempt 6 (passed)
       *    Attempt 7 (passed) (passesRequired met)
       *
       * Suite 3 (passed)
       *  Test 1 (passed)
       *   Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 5 tests passed / 0 tests failed
       *
       * 'detect-flake-but-always-fail':
       *
       * Suite 1 (failed)
       *  Test 1 (failed)
       *    Attempt 1  (failed)
       *    Attempt 2  (passed)
       *    Attempt 3  (passed)
       *    Attempt 4  (passed)
       *    Attempt 5  (passed)
       *    Attempt 6  (passed)
       *    Attempt 7  (passed)
       *    Attempt 8  (passed)
       *    Attempt 9  (passed)
       *    Attempt 10 (passed) (maxRetries achieved because stopIfAnyPassed=false, fail the test because flaky)
       *  Test 2 (passed)
       *    Attempt 1 (passed)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * Suite 2 (failed)
       *  Test 1 (failed)
       *    Attempt 1  (failed)
       *    Attempt 2  (failed)
       *    Attempt 3  (passed)
       *    Attempt 4  (passed)
       *    Attempt 5  (passed)
       *    Attempt 6  (passed)
       *    Attempt 7  (passed)
       *    Attempt 8  (passed)
       *    Attempt 9  (passed)
       *    Attempt 10 (passed) (maxRetries achieved because stopIfAnyPassed=false, fail the test because flaky)
       *
       * Suite 3 (passed)
       *  Test 1 (passed)
       *   Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 3 tests passed / 2 tests failed
       *
       * 'detect-flake-but-always-fail-stop-any-passed':
       *
       * Suite 1 (failed)
       *  Test 1 (failed)
       *    Attempt 1 (failed)
       *    Attempt 2  (passed) (stopIfAnyPassed=true so stop attempts, fail the test because flaky)
       *  Test 2 (passed)
       *    Attempt 1 (passed)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * Suite 2 (failed)
       *  Test 1 (failed)
       *    Attempt 1  (failed)
       *    Attempt 2  (failed)
       *    Attempt 3  (passed) (stopIfAnyPassed=true so stop attempts, fail the test because flaky)
       *
       * Suite 3 (passed)
       *  Test 1 (passed)
       *   Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 3 tests passed / 2 tests failed
       */
      describe('can retry from [afterEach]', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents can retry from [afterEach] #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/can-retry-from-afterEach.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/can-retry-from-afterEach.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 5 : 3,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 2,
          })
        })
      })

      // this is the same for each test strategy. If the before hook fails the who suite is skipped and tests aren't run
      describe('cant retry from [before]', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents cant retry from [before] #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/cant-retry-from-before.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/cant-retry-from-before.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: 0,
            failCount: 1,
          })
        })
      })

      /**
       * This will differ per strategy. The spec under test is a bit more complex
       * for each project:
       *
       * 'detect-flake-and-pass-on-threshold':
       *
       * Suite 1 (passed)
       *  Test 1 (passed)
       *    Attempt 1 (passed)
       *  Test 2 (passed)
       *    Attempt 1 (failed)
       *    Attempt 2 (failed)
       *    Attempt 3 (passed)
       *    Attempt 4 (passed)
       *    Attempt 5 (passed)
       *    Attempt 6 (passed)
       *    Attempt 7 (passed) (passesRequired met)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 3 tests passed / 0 tests failed
       *
       * 'detect-flake-but-always-fail':
       *
       * Suite 1 (failed)
       *  Test 1 (passed)
       *   Attempt 1  (passed)
       *  Test 2 (failed)
       *    Attempt 1  (failed)
       *    Attempt 2  (failed)
       *    Attempt 3  (passed)
       *    Attempt 4  (passed)
       *    Attempt 5  (passed)
       *    Attempt 6  (passed)
       *    Attempt 7  (passed)
       *    Attempt 8  (passed)
       *    Attempt 9  (passed)
       *    Attempt 10 (passed) (maxRetries achieved because stopIfAnyPassed=false, fail the test because flaky)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 2 tests passed / 1 tests failed
       *
       * 'detect-flake-but-always-fail-stop-any-passed':
       *
      * Suite 1 (failed)
       *  Test 1 (passed)
       *   Attempt 1  (passed)
       *  Test 2 (failed)
       *    Attempt 1  (failed)
       *    Attempt 2  (failed)
       *    Attempt 3  (passed) (stopIfAnyPassed=true so stop attempts, fail the test because flaky)
       *  Test 3 (passed)
       *    Attempt 1 (passed)
       *
       * FINAL RESULT:
       * 2 tests passed / 1 tests failed
       */
      describe('three tests with retry', () => {
        it('matches mocha snapshot', (done) => {
          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents three tests with retry #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/three-tests-with-retry.retries.mochaEvents.cy.js',
            projectName: project,
          }).then((win) => {
            assertMatchingSnapshot(win)
          })
        })

        it('displays correct passed/failed tests', () => {
          loadSpec({
            filePath: 'runner/experimental-retries/three-tests-with-retry.retries.mochaEvents.cy.js',
            projectName: project,
            passCount: project === 'detect-flake-and-pass-on-threshold' ? 3 : 2,
            failCount: project === 'detect-flake-and-pass-on-threshold' ? 0 : 1,
          })
        })
      })

      // This will differ per strategy
      // for each project:
      // 'detect-flake-and-pass-on-threshold': will run a total of 6 times. All attempts fail. The test fails
      // 'detect-flake-but-always-fail': will run a total of 10 times. All attempts fail. The test fails.
      // 'detect-flake-but-always-fail-stop-any-passed': will run a total of 10 times. All attempts fail. The test fails.
      describe('cleanses errors before emitting', () => {
        it('does not try to serialize error with err.actual as DOM node', function (done) {
          // because there are more attempts for 'detect-flake-but-always-fail', the timeout needs to be increased
          this.timeout(15000)

          const { assertMatchingSnapshot } = runCypressInCypressMochaEventsTest(
            snapshots,
            `"${project}": retries mochaEvents cleanses errors before emitting does not try to serialize error with err.actual as DOM node #1`,
            done,
          )

          runSpec({
            fileName: 'experimental-retries/does-not-serialize-dom-error.cy.js',
            projectName: project,
          }).then((win) => {
            // should not have err.actual, expected properties since the subject is a DOM element
            assertMatchingSnapshot(win)
          })
        })
      })
    })
  })
})
